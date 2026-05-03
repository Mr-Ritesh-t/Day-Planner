import { cntDone } from '../constants';

export default function StudyLeaderboard({ fullState, deviceUserId }) {
  const profiles = fullState?.profiles || {};
  const ids = Object.keys(profiles);

  if (ids.length < 2) return null;

  const localId = deviceUserId;
  const partnerId = ids.find(id => id !== localId);

  const me = profiles[localId];
  const partner = profiles[partnerId];

  if (!me || !partner) return null;

  const getWeekStudyMins = (p) => p.weekStudyMins || p.studyMins || 0;
  const myMins = getWeekStudyMins(me);
  const pMins = getWeekStudyMins(partner);
  const maxMins = Math.max(myMins, pMins, 60);

  const myHrs = (myMins / 60).toFixed(1);
  const pHrs = (pMins / 60).toFixed(1);

  const myTasks = cntDone(me);
  const pTasks = cntDone(partner);

  const myAssign = (me.assignments || []).filter(a => a.status === 'submitted').length;
  const pAssign = (partner.assignments || []).filter(a => a.status === 'submitted').length;

  const myScore = myMins + myTasks * 10 + (me.streak || 0) * 5 + myAssign * 15;
  const pScore = pMins + pTasks * 10 + (partner.streak || 0) * 5 + pAssign * 15;
  const iWin = myScore >= pScore;

  const compare = (a, b, isHigherBetter = true) => {
    if (a === b) return 'tie';
    if (isHigherBetter) return a > b ? 'me' : 'partner';
    return a < b ? 'me' : 'partner';
  };

  const statRow = (label, aVal, bVal, suffix = '') => {
    const winner = compare(aVal, bVal);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ width: '80px', textAlign: 'right', fontWeight: winner === 'me' ? 800 : 400, color: winner === 'me' ? 'var(--primary)' : 'var(--text-dim)' }}>
          {aVal}{suffix} {winner === 'me' && '🏆'}
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>{label}</div>
        <div style={{ width: '80px', fontWeight: winner === 'partner' ? 800 : 400, color: winner === 'partner' ? 'var(--primary)' : 'var(--text-dim)' }}>
          {winner === 'partner' && '🏆 '}{bVal}{suffix}
        </div>
      </div>
    );
  };

  return (
    <div className="gc" style={{ padding: '0', overflow: 'hidden', marginBottom: '16px', margin: '10px' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--primary)22, var(--secondary)11)', padding: '16px 20px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Study Leaderboard</div>
        <div style={{ fontSize: '14px', fontWeight: 800 }}>Who's studying more this week? 🏆</div>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '24px' }}>🧑‍💻</div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>{me.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>(You)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
            <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }} />
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: '24px' }}>👩‍💻</div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--primary)' }}>{partner.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>(Partner)</div>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '8px', fontWeight: 600 }}>Study Hours This Week</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right', width: '36px', fontWeight: 800, fontSize: '13px', color: 'var(--primary)' }}>{myHrs}h</div>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: '10px', background: 'var(--surface-container-low)', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
                <div style={{ flex: myMins / maxMins, background: 'linear-gradient(90deg, var(--primary), var(--primary)cc)', borderRadius: '10px', transition: 'flex 0.6s ease' }} />
              </div>
            </div>
            <div style={{ width: '36px', fontWeight: 800, fontSize: '13px', color: 'var(--primary)' }}>{pHrs}h</div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ width: '36px' }} />
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ height: '10px', background: 'var(--surface-container-low)', borderRadius: '10px', overflow: 'hidden', display: 'flex', flexDirection: 'row-reverse' }}>
                <div style={{ flex: pMins / maxMins, background: 'linear-gradient(270deg, var(--secondary, #e28743), var(--secondary, #e28743)cc)', borderRadius: '10px', transition: 'flex 0.6s ease' }} />
              </div>
            </div>
            <div style={{ width: '36px' }} />
          </div>
        </div>

        {statRow('Today\'s Tasks', myTasks, pTasks)}
        {statRow('Day Streak', me.streak, partner.streak, 'd')}
        {statRow('Total Points', me.score, partner.score, ' pts')}
        {statRow('Assignments Done', myAssign, pAssign)}

        <div style={{ textAlign: 'center', marginTop: '16px', padding: '12px', background: 'linear-gradient(135deg, var(--primary)15, var(--primary)05)', borderRadius: '14px' }}>
          <div style={{ fontWeight: 800, fontSize: '14px' }}>
            {myScore === pScore
              ? '🤝 You\'re tied! Perfect balance!'
              : iWin
              ? `🏆 ${me.name} is leading this week!`
              : `🏆 ${partner.name} is leading this week!`
            }
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
            {iWin ? `Keep it up!` : `Come on, you can catch up! 💪`}
          </div>
        </div>
      </div>
    </div>
  );
}
