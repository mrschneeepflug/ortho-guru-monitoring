import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { DETAIL_TAG_OPTIONS } from 'shared';

export interface AiTagSuggestion {
  overallTracking: number;
  alignerFit: number;
  oralHygiene: number;
  detailTags: string[];
  actionTaken: string | null;
  notes: string | null;
  confidence: number;
}

const SYSTEM_PROMPT = `You are a clinical orthodontic AI assistant analyzing dental scan images. Your role is to evaluate intraoral photographs of patients undergoing clear aligner treatment and provide structured clinical assessments.

Evaluate each image set and return a JSON object with the following fields:

- "overallTracking": integer 1-3 (1=Good tracking, teeth moving as planned; 2=Fair, minor deviations; 3=Poor, significant tracking issues)
- "alignerFit": integer 1-3 (1=Good fit, aligner seated well; 2=Fair, minor gaps; 3=Poor, significant gaps or not seating)
- "oralHygiene": integer 1-3 (1=Good hygiene; 2=Fair, some plaque/inflammation; 3=Poor, significant plaque/gingivitis)
- "detailTags": array of applicable tags from this exact list: ${JSON.stringify(DETAIL_TAG_OPTIONS)}
- "actionTaken": suggested action string or null (e.g., "Recommend rescan", "Schedule office visit", "Continue current stage")
- "notes": brief clinical observation string or null
- "confidence": number 0-1 representing your confidence in the assessment

Only include detail tags that are clearly visible in the images. Be conservative — when uncertain, lean toward moderate scores (2) and lower confidence.

Respond with ONLY the JSON object, no other text.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic | null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.logger.log('AI service configured (Anthropic Claude)');
    } else {
      this.client = null;
      this.logger.warn('ANTHROPIC_API_KEY not set — AI suggestions disabled');
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async analyzeScanImages(
    images: Array<{ mediaType: string; buffer: Buffer }>,
  ): Promise<AiTagSuggestion> {
    if (!this.client) {
      throw new Error('AI service is not configured');
    }

    const imageBlocks: Anthropic.Messages.ImageBlockParam[] = images.map(
      (img) => ({
        type: 'image' as const,
        source: {
          type: 'base64' as const,
          media_type: img.mediaType as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
          data: img.buffer.toString('base64'),
        },
      }),
    );

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: 'Analyze these dental scan images and provide your clinical assessment as JSON.',
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI');
    }

    const parsed = JSON.parse(textBlock.text);
    return this.validateSuggestion(parsed);
  }

  private validateSuggestion(raw: Record<string, unknown>): AiTagSuggestion {
    const clamp = (v: unknown, min: number, max: number): number => {
      const n = Number(v);
      if (isNaN(n)) return 2;
      return Math.max(min, Math.min(max, Math.round(n)));
    };

    const validDetailTags = Array.isArray(raw.detailTags)
      ? (raw.detailTags as string[]).filter((t) =>
          (DETAIL_TAG_OPTIONS as readonly string[]).includes(t),
        )
      : [];

    return {
      overallTracking: clamp(raw.overallTracking, 1, 3),
      alignerFit: clamp(raw.alignerFit, 1, 3),
      oralHygiene: clamp(raw.oralHygiene, 1, 3),
      detailTags: validDetailTags,
      actionTaken:
        typeof raw.actionTaken === 'string' ? raw.actionTaken : null,
      notes: typeof raw.notes === 'string' ? raw.notes : null,
      confidence: Math.max(
        0,
        Math.min(1, Number(raw.confidence) || 0.5),
      ),
    };
  }
}
