import React, { useState } from 'react';

interface AISummarizerProps {
  notepadContent: string;
  onSummaryGenerated?: (summary: string) => void;
}

const AISummarizer: React.FC<AISummarizerProps> = ({ 
  notepadContent, 
  onSummaryGenerated 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'action'>('brief');

  // IMPORTANT: Replace with your NEW Gemini API key (after revoking the old one)
  const GEMINI_API_KEY = 'YOUR_NEW_GEMINI_KEY_HERE';

  const getSummaryPrompt = (type: 'brief' | 'detailed' | 'action') => {
    const prompts = {
      brief: 'Provide a concise 2-3 sentence summary of the key points from these meeting notes.',
      detailed: 'Provide a detailed summary of these meeting notes, including main topics discussed, decisions made, and important details.',
      action: 'Extract and list all action items, tasks, and follow-ups from these meeting notes. Format as a bullet list with responsible parties if mentioned.'
    };
    return prompts[type];
  };

  const summarizeNotes = async () => {
    if (!notepadContent.trim()) {
      setError('Notepad is empty. Add some notes first!');
      return;
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_NEW_GEMINI_KEY_HERE') {
      setError('Please add your Gemini API key in AISummarizer.tsx');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Truncate content to avoid token limits
      const truncatedContent = notepadContent.slice(0, 4000);
      const isTruncated = notepadContent.length > 4000;

      const prompt = `${getSummaryPrompt(summaryType)}\n\nMeeting Notes:\n${truncatedContent}${isTruncated ? '\n\n[Note: Content was truncated due to length]' : ''}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 500
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || 
          `Gemini API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error('Unexpected response format from Gemini API');
      }

      const generatedSummary = data.candidates[0].content.parts[0].text;
      
      setSummary(generatedSummary);
      
      if (onSummaryGenerated) {
        onSummaryGenerated(generatedSummary);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate summary';
      setError(errorMessage);
      console.error('Summarization error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary)
      .then(() => alert('Summary copied to clipboard!'))
      .catch(() => alert('Failed to copy summary'));
  };

  const clearSummary = () => {
    setSummary('');
    setError(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.controls}>
        <select 
          value={summaryType}
          onChange={(e) => setSummaryType(e.target.value as any)}
          style={styles.select}
          disabled={loading}
        >
          <option value="brief">Brief Summary</option>
          <option value="detailed">Detailed Summary</option>
          <option value="action">Action Items</option>
        </select>

        <button 
          onClick={summarizeNotes}
          disabled={loading || !notepadContent.trim()}
          style={{
            ...styles.button,
            ...(loading || !notepadContent.trim() ? styles.buttonDisabled : {})
          }}
        >
          {loading ? (
            <>
              <span style={styles.spinner}>⏳</span>
              Generating...
            </>
          ) : (
            <>✨ Generate Summary</>
          )}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      {summary && (
        <div style={styles.summaryBox}>
          <div style={styles.summaryHeader}>
            <strong>📋 {summaryType.charAt(0).toUpperCase() + summaryType.slice(1)} Summary:</strong>
            <div style={styles.summaryActions}>
              <button 
                onClick={copySummary}
                style={styles.actionButton}
                title="Copy to clipboard"
              >
                📋 Copy
              </button>
              <button 
                onClick={clearSummary}
                style={{...styles.actionButton, ...styles.clearButton}}
                title="Clear summary"
              >
                ✕ Clear
              </button>
            </div>
          </div>
          <div style={styles.summaryText}>{summary}</div>
        </div>
      )}

      <div style={styles.info}>
        💡 Tip: Type your meeting notes above and click "Generate Summary" to get an AI-powered summary
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '16px',
    padding: '16px',
    borderTop: '2px solid #e9ecef',
    backgroundColor: '#f8f9fa'
  },
  controls: {
    display: 'flex',
    gap: '12px',
    marginBottom: '12px'
  },
  select: {
    flex: '1',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ced4da',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer'
  },
  button: {
    flex: '2',
    padding: '10px 20px',
    backgroundColor: '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600 as const,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  spinner: {
    display: 'inline-block'
  },
  error: {
    marginBottom: '12px',
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#842029',
    borderRadius: '6px',
    fontSize: '14px',
    border: '1px solid #f5c2c7'
  },
  summaryBox: {
    marginBottom: '12px',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
  },
  summaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e9ecef'
  },
  summaryActions: {
    display: 'flex',
    gap: '8px'
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#198754',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500 as const,
    transition: 'background-color 0.2s'
  },
  clearButton: {
    backgroundColor: '#dc3545'
  },
  summaryText: {
    lineHeight: '1.7',
    fontSize: '14px',
    whiteSpace: 'pre-wrap' as const,
    color: '#212529'
  },
  info: {
    fontSize: '12px',
    color: '#6c757d',
    textAlign: 'center' as const,
    fontStyle: 'italic' as const
  }
};

export default AISummarizer;
