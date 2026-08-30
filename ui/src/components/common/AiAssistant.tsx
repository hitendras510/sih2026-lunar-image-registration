import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  typing?: boolean;
}

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: 'Ask me about the pipeline, matchers, metrics or how the registration system works. ◆',
    },
  ]);

  const msgsEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const generateAnswer = (q: string): string => {
    const query = q.toLowerCase();
    if (query.includes('rmse')) {
      return 'RMSE measures the remaining geometric error after registration. The project target is below 1 pixel, achieved through native-resolution IC-LK sub-pixel refinement.';
    }
    if (query.includes('magsac')) {
      return 'MAGSAC++ is the robust estimator used in Stage S5. It fits the transformation model while automatically rejecting geometrically inconsistent outlier matches.';
    }
    if (query.includes('gate') || query.includes('matcher') || query.includes('match')) {
      return 'The matcher gate (S3) reads sensor type, GSD and Sun-angle metadata, then routes the pair to a specialist: LightGlue, SIFT, Crater Graph, Phase Correlation or Mutual Information.';
    }
    if (query.includes('pipeline') || query.includes('stage') || query.includes('how')) {
      return 'The pipeline is: S0 ingest, S1 GSD equalization, S2 illumination preparation, S3 gate, S4 match, S5 MAGSAC++, S6 IC-LK sub-pixel refinement, S7 uniform 8×8 GCP warp, S8 products + report.';
    }
    if (query.includes('gsd') || query.includes('scale') || query.includes('resolution')) {
      return 'Sensor GSDs range from 0.25 m (OHRC) to 80 m (IIRS). Stage S1 builds a common metres-per-pixel pyramid so both images are comparable — handling up to 320× scale disparity.';
    }
    if (query.includes('crater')) {
      return 'The Crater Graph matcher detects crater rims, builds a topological graph and matches graph structures. It excels under extreme illumination differences where pixel-level matchers fail.';
    }
    if (query.includes('output') || query.includes('product') || query.includes('export')) {
      return 'Each run produces registered.tif, matches.csv, checkerboard/residual/quiver diagnostics and a one-page registration_report.pdf.';
    }
    return 'SELENE-MATCH aligns lunar images from different sensors using GSD equalization, illumination preparation, gated matching, robust geometry (MAGSAC++) and sub-pixel refinement (IC-LK).';
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputVal).trim();
    if (!q || isBusy) return;

    setInputVal('');
    setIsBusy(true);

    const userMsgId = Math.random().toString();
    const botMsgId = Math.random().toString();

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, sender: 'user', text: q },
      { id: botMsgId, sender: 'bot', text: '', typing: true },
    ]);

    setTimeout(() => {
      const ans = generateAnswer(q);
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, text: ans, typing: false } : m))
      );
      setIsBusy(false);
    }, 850 + Math.random() * 500);
  };

  return (
    <div className="ai">
      <div className={`ai-box ${isOpen ? 'open' : ''}`} id="aiBox">
        <div className="ai-head">
          <span className="led" />
          <b>SELENE-MATCH AI</b>
          <small>ONLINE</small>
        </div>
        <div className="ai-msgs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`msg ${m.sender} ${m.typing ? 'typing' : ''}`}
            >
              {m.typing ? (
                <>
                  <i />
                  <i />
                  <i />
                </>
              ) : (
                m.text
              )}
            </div>
          ))}
          <div ref={msgsEndRef} />
        </div>
        <div className="ai-suggest">
          <button onClick={() => handleSend('How does the pipeline work?')}>
            PIPELINE
          </button>
          <button onClick={() => handleSend('What is the RMSE target?')}>
            RMSE TARGET
          </button>
          <button onClick={() => handleSend('How does the matcher gate work?')}>
            MATCHER GATE
          </button>
        </div>
        <div className="ai-inputrow">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about SELENE-MATCH..."
            autoComplete="off"
          />
          <button onClick={() => handleSend()} aria-label="Send">
            ↗
          </button>
        </div>
      </div>
      <button
        className="ai-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="AI assistant"
      >
        ✦
      </button>
    </div>
  );
};
