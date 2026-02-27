export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-medical-blue/5 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-bissig.jpg" alt="bissig Kieferorthopädie" className="mx-auto" style={{ width: 80 }} />
        </div>
        {children}
      </div>
    </div>
  );
}
