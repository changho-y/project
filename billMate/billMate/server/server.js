// server/server.js — Assistant API (AI+목업 안전망)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit').default;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

const PORT = process.env.PORT || 5050;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 헬스체크
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Server alive ✅' });
});

const SYSTEM_PROMPT = `
너는 자취를 막 시작한 사회 초년생의 생활비/고정비 관리를 도와주는 따뜻한 한국어 AI 비서야.

반드시 아래 JSON 형식으로만 출력해야 해:
{
  "type": "add_record" | "summary_week" | "summary_month" | "smalltalk",
  "category": "전기세" | "수도세" | "가스비" | "관리비" | null,
  "amount": number | null,
  "replyText": string
}

replyText 톤 규칙:
- 응원하는 말투 (함께 해주는 느낌)
- 꾸짖거나 명령하지 않음
- 항상 칭찬 1개 + 쉽게 실천 가능한 조언 1개 포함
- 길이는 2~4문장으로 짧게
- 금액은 항상 쉼표 포함 (예: 45000 → 45,000원)

의도 판단:
- "이번주", "주간" → type = "summary_week"
- "이번달", "월간" → type = "summary_month"
- "<카테고리> <금액>" 형태 → type = "add_record"
- 그 외는 type = "smalltalk"

예시 replyText 톤:
- "좋아요! 전기세 45,000원 기록해둘게요 😊 이번 달엔 사용량이 안정적이에요. 콘센트 대기전력만 줄이면 조금 더 절약할 수 있어요."
- "이번 주 지출 체크해봤어요! 수도세가 약간 올랐지만 전반적으로 잘 하고 있어요 👍 샤워 시간을 2~3분만 줄이면 금방 좋아져요."
- "오늘도 잘해내고 있어요. 천천히 해도 괜찮아요 🌱"
`;



// 주 엔드포인트
app.post('/api/assistant', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message is required' });

    // 🔐 키가 없으면 "목업"으로라도 동작 (개발 편의)
    if (!OPENAI_API_KEY) {
      console.log('POST /api/assistant (MOCK, no API key)', req.body);
      const msg = String(message);
      if (/이번주|주간/.test(msg)) {
        return res.json({
          type: 'summary_week',
          category: null,
          amount: null,
          replyText: '주간 요약 (목업): 전기세 0원, 수도세 0원, 가스비 0원, 관리비 0원.',
        });
      }
      const m = msg.match(/(전기세|수도세|가스비|관리비)\s*(\d+)/);
      if (m) {
        return res.json({
          type: 'add_record',
          category: m[1],
          amount: Number(m[2]),
          replyText: `${m[1]} ${Number(m[2]).toLocaleString()}원 기록할게요 (목업).`,
        });
      }
      return res.json({
        type: 'smalltalk',
        category: null,
        amount: null,
        replyText: '테스트 OK (목업 응답)',
      });
    }

    // 🔗 OpenAI 호출 (Node 18+ 내장 fetch)
    const body = {
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: String(message).trim() },
      ],
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error('OpenAI error:', t);
      return res.status(500).json({ error: 'assistant_error' });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { type: 'smalltalk', category: null, amount: null, replyText: '요청을 이해하지 못했어요.' };
    }

    if (!parsed.replyText) parsed.replyText = '요청을 이해했어요.';
    res.json(parsed);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'server_error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Assistant API Running → http://localhost:${PORT}`);
});
