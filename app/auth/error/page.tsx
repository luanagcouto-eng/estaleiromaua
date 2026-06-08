import Link from "next/link";

const MESSAGES: Record<string, string> = {
  domain:
    "Acesso restrito. Apenas colaboradores com e-mail @estaleiromaua.ind.br podem acessar este sistema.",
  callback: "Ocorreu um erro durante a autenticação. Tente novamente.",
  default: "Erro de autenticação. Tente novamente.",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const message = MESSAGES[searchParams.reason ?? "default"] ?? MESSAGES.default;

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-elevated p-8 max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">Acesso negado</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
        <Link
          href="/login"
          className="inline-block bg-primary text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Voltar ao login
        </Link>
      </div>
    </div>
  );
}
