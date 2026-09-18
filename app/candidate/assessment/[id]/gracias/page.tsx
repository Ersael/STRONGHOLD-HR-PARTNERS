export default function CandidateThankYouPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
      <h1 className="text-2xl font-bold text-indigo-950">¡Gracias por completar esta evaluación!</h1>
      <p className="text-sm text-gray-600">
        Hemos recibido tus respuestas correctamente. El equipo de reclutamiento revisará los resultados como
        parte del proceso de selección. No es necesario que hagas nada más.
      </p>
      <a href="/candidate" className="text-sm font-medium text-indigo-700 hover:underline">
        Volver a mi panel
      </a>
    </main>
  );
}
