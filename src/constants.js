export const ME = { happy: '😊', loved: '🥰', okay: '😐', tired: '😔', sad: '😢' };

export const MSGS = [
  { i: '💖', t: "I'm so proud of you ❤️" },
  { i: '✨', t: "You're doing absolutely amazing!" },
  { i: '🌸', t: "Don't forget to smile today 😊" },
  { i: '🌟', t: "Every little step counts, superstar!" },
  { i: '💌', t: "You are loved more than you know" },
  { i: '🌈', t: "Beautiful days are made by beautiful people like you" },
  { i: '🦋', t: "You're growing, glowing, and going strong!" },
  { i: '🍀', t: "Good things are coming your way" },
  { i: '💫', t: "Rest if you must, but don't quit 💫" },
  { i: '🌺', t: "You make the world prettier just by being in it" },
  { i: '🎀', t: "I love you so much" },
  { i: '💝', t: "You deserve all the good things in this world" },
];

export const ACH = [
  { id: 'f1', icon: '😘', name: 'Kiss', desc: 'Complete your first task', pts: 50, req: (s) => cntDone(s) >= 1 },
  { id: 'f5', icon: '🌸', name: 'Bloom', desc: 'Complete 5 tasks', pts: 100, req: (s) => cntDone(s) >= 5 },
  { id: 's3', icon: '🔥', name: 'On Fire!', desc: '3-day streak', pts: 150, req: (s) => s.streak >= 3 },
  { id: 'n1', icon: '✍️', name: 'Dear Diary', desc: 'Write your first note', pts: 50, req: (s) => s.notes.length >= 1 },
  { id: 'h1', icon: '💫', name: 'Consistency', desc: 'Complete all habits', pts: 200, req: (s) => s.habits.every(h => h.done) },
  { id: 'm7', icon: '🌈', name: 'Mood Tracker', desc: 'Log mood 7 days', pts: 100, req: (s) => s.moodHist.length >= 7 },
  { id: 'st60', icon: '📖', name: 'Scholar', desc: 'Study 60+ minutes', pts: 200, req: (s) => s.studyMins >= 60 },
  { id: 'p100', icon: '⭐', name: 'Star Collector', desc: 'Cross 100 total points', pts: 0, req: (s) => s.score >= 100 },
  { id: 'p500', icon: '🏆', name: 'Bronze Dedication', desc: 'Cross 500 total points', pts: 0, req: (s) => s.score >= 500 },
  { id: 'p1000', icon: '💎', name: 'Silver Commitment', desc: 'Cross 1000 total points', pts: 0, req: (s) => s.score >= 1000 },
  { id: 'p1500', icon: '👑', name: 'Point Master', desc: 'Cross 1500 total points', pts: 0, req: (s) => s.score >= 1500 },
  { id: 'p3000', icon: '🌌', name: 'Cosmic Legend', desc: 'Cross 3000 total points', pts: 0, req: (s) => s.score >= 3000 },
];

export const cntDone = (s) => Object.values(s.tasks).flat().filter(t => t.done).length;
