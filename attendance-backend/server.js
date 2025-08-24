const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Static files (our small frontend)
app.use(express.static(path.join(__dirname, 'public')));

// In-memory store: meetingId -> { participants: Map(participantId -> { name, sessions:[{in,out}] }) }
const meetings = new Map();
const ensureMeeting = (id) => {
  if (!meetings.has(id)) meetings.set(id, { participants: new Map() });
  return meetings.get(id);
};

app.post('/api/checkin', (req, res) => {
  const { conferenceId, participantId, name } = req.body || {};
  if (!conferenceId || !participantId) {
    return res.status(400).json({ error: 'conferenceId & participantId required' });
  }
  const mtg = ensureMeeting(conferenceId);
  const p = mtg.participants.get(participantId) || { name: name || participantId, sessions: [] };
  p.name = name || p.name;
  p.sessions.push({ in: new Date().toISOString(), out: null });
  mtg.participants.set(participantId, p);
  res.json({ ok: true });
});

app.post('/api/checkout', (req, res) => {
  const { conferenceId, participantId } = req.body || {};
  if (!conferenceId || !participantId) {
    return res.status(400).json({ error: 'conferenceId & participantId required' });
  }
  const mtg = ensureMeeting(conferenceId);
  const p = mtg.participants.get(participantId);
  if (p && p.sessions.length) {
    const last = p.sessions[p.sessions.length - 1];
    if (!last.out) last.out = new Date().toISOString();
  }
  res.json({ ok: true });
});

app.get('/api/report/:conferenceId', async (req, res) => {
  const id = req.params.conferenceId;
  const mtg = meetings.get(id);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance');

  ws.columns = [
    { header: 'Participant', key: 'name', width: 30 },
    { header: 'First Check-In', key: 'firstIn', width: 22 },
    { header: 'Last Check-Out', key: 'lastOut', width: 22 },
    { header: 'Total Minutes', key: 'totalMin', width: 15 }
  ];

  if (mtg) {
    for (const [, p] of mtg.participants) {
      const firstIn = p.sessions[0]?.in || '';
      const lastOut = p.sessions.map(s => s.out).filter(Boolean).slice(-1)[0] || '';
      let total = 0;
      for (const s of p.sessions) {
        if (s.in) {
          const tin = new Date(s.in).getTime();
          const tout = s.out ? new Date(s.out).getTime() : Date.now();
          total += Math.max(0, Math.floor((tout - tin) / 60000));
        }
      }
      ws.addRow({ name: p.name, firstIn, lastOut, totalMin: total });
    }
  }

  res.setHeader('Content-Disposition', `attachment; filename="${id}-attendance.xlsx"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  await wb.xlsx.write(res);
  res.end();
});

const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Attendance backend running at http://localhost:${PORT}`));
