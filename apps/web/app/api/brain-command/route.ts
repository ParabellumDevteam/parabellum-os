export async function POST(req: Request) {
  const body = await req.json()

  if (body.command === "fetch" && body.path) {
    const r = await fetch("http://127.0.0.1:3001" + body.path, {
      headers: {
        "x-brain-key": "brain_test_123"
      },
      cache: "no-store"
    })

    const data = await r.json()
    return Response.json(data, { status: r.status })
  }

  const r = await fetch("http://127.0.0.1:3001/internal/brain/command", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-brain-key": "brain_test_123"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  })

  const data = await r.json()
  return Response.json(data, { status: r.status })
}
