export async function POST(req: Request) {
  const { candidateId } = await req.json().catch(() => ({ candidateId: null }));
  console.log("[pipeline/send] STUB invoked for candidate", candidateId);
  return Response.json(
    {
      success: false,
      message: "Postcard sending lands in step 4. Stay tuned.",
    },
    { status: 501 }
  );
}
