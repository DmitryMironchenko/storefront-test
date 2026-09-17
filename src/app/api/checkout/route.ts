export async function POST(request: Request) {
  const payload = await request.json();

  console.log('[checkout]', payload);

  return Response.json({
    success: true,
    orderId: crypto.randomUUID(),
  });
}
