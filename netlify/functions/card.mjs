import { getStore } from "@netlify/blobs";

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});

export default async (request) => {
  const store = getStore("popwish-cards");

  if (request.method === "POST") {
    try {
      const raw = await request.text();
      if (raw.length > 5_500_000) return json({ error: "This card is too large to share. Try using fewer or smaller photos." }, 413);
      const card = JSON.parse(raw);
      if (!card || !Array.isArray(card.cards) || card.cards.length > 10) {
        return json({ error: "Invalid PopWish card data." }, 400);
      }
      const id = crypto.randomUUID().replaceAll("-", "").slice(0, 12);
      await store.setJSON(id, card);
      return json({ id }, 201);
    } catch (error) {
      return json({ error: "The card could not be saved. Please try again with smaller photos." }, 500);
    }
  }

  if (request.method === "GET") {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[a-f0-9]{12}$/i.test(id)) return json({ error: "Invalid card link." }, 400);
    const card = await store.get(id, { type: "json" });
    if (!card) return json({ error: "This card could not be found." }, 404);
    return json(card);
  }

  return json({ error: "Method not allowed." }, 405);
};
