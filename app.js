// Application state
let autoTimestamp = false;
let footnotes = { ...DEFAULT_FOOTNOTES };

// Initialize on page load
window.addEventListener('load', () => {
    const now = new Date();
    const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('startTime').value = localDatetime;
    
    // Set up keyboard shortcuts
    document.getElementById('editor').addEventListener('keydown', handleKeyboardShortcuts);
});

// Utility Functions
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function updateStatus(message) {
    const status = document.getElementById('status');
    status.textContent = message;
    setTimeout(() => {
        status.textContent = 'Ready';
    }, 2000);
}

function parseTime(timeStr) {
    // Handle datetime-local format (YYYY-MM-DDTHH:MM)
    if (timeStr.includes('T')) {
        const [datePart, timePart] = timeStr.split('T');
        const [hours, minutes] = timePart.split(':').map(Number);
        return { hours, minutes, seconds: 0 };
    }
    
    // Handle HH:MM:SS or HH:MM format
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) {
        return { hours: parts[0], minutes: parts[1], seconds: parts[2] };
    } else if (parts.length === 2) {
        return { hours: parts[0], minutes: parts[1], seconds: 0 };
    }
    return null;
}

function timeToSeconds(timeObj) {
    return timeObj.hours * 3600 + timeObj.minutes * 60 + timeObj.seconds;
}

function secondsToElapsed(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    } else {
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }
}

// Core Functions
function setStartTimeNow() {
    const now = new Date();
    const localDatetime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
    document.getElementById('startTime').value = localDatetime;
    updateStatus('Start time set to current time');
}

function toggleAutoTimestamp() {
    autoTimestamp = !autoTimestamp;
    const toggle = document.getElementById('autoTimestampToggle');
    toggle.classList.toggle('active');
    updateStatus(autoTimestamp ? 'Auto-timestamp enabled' : 'Auto-timestamp disabled');
}

function insertTimestamp() {
    const editor = document.getElementById('editor');
    const timestamp = `[${getCurrentTime()}]`;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    
    editor.value = text.substring(0, start) + timestamp + ' ' + text.substring(end);
    editor.selectionStart = editor.selectionEnd = start + timestamp.length + 1;
    editor.focus();
    updateStatus('Timestamp inserted');
}

function toggleQuickInsert() {
    const panel = document.getElementById('quickInsertPanel');
    const arrow = document.getElementById('quickInsertArrow');
    if (panel.style.display === 'none') {
        panel.style.display = 'block';
        arrow.classList.add('open');
    } else {
        panel.style.display = 'none';
        arrow.classList.remove('open');
    }
}

function insertAgenda() {
    const editor = document.getElementById('editor');
    const start = editor.selectionStart;
    const text = editor.value;
    
    editor.value = text.substring(0, start) + MEETING_AGENDA + text.substring(start);
    editor.selectionStart = editor.selectionEnd = start + MEETING_AGENDA.length;
    editor.focus();
    updateStatus('Agenda inserted');
}

function insertPhrase(phraseType) {
    const editor = document.getElementById('editor');
    const timestamp = `[${getCurrentTime()}]`;
    const phrase = PHRASE_TEMPLATES[phraseType] || '';
    const fullPhrase = `${timestamp} ${phrase}`;
    
    const start = editor.selectionStart;
    const text = editor.value;
    
    editor.value = text.substring(0, start) + fullPhrase + text.substring(start);
    editor.selectionStart = editor.selectionEnd = start + fullPhrase.length;
    editor.focus();
    updateStatus('Phrase inserted');
}

function toggleFootnotes() {
    const footnoteList = Object.entries(footnotes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    
    const result = prompt(
        'Manage Footnotes\n\n' +
        'Current footnotes:\n' +
        footnoteList + '\n\n' +
        'To add a new footnote, enter: ACRONYM|Definition\n' +
        'To use a footnote in your text, type the acronym and it will be marked with [^1] etc.',
        ''
    );
    
    if (result && result.includes('|')) {
        const [key, value] = result.split('|').map(s => s.trim());
        if (key && value) {
            footnotes[key] = value;
            updateStatus(`Footnote added: ${key}`);
        }
    }
}

function addFootnoteReferences(text) {
    const footnoteMap = {};
    let counter = 1;
    let processedText = text;
    
    // Find all acronyms in the text and add footnote references
    Object.keys(footnotes).forEach(acronym => {
        const regex = new RegExp(`\\b${acronym}\\b(?!\\[\\^)`, 'g');
        const matches = text.match(regex);
        
        if (matches && matches.length > 0) {
            if (!footnoteMap[acronym]) {
                footnoteMap[acronym] = counter++;
            }
            // Only add [^n] to first occurrence
            let firstOccurrence = true;
            processedText = processedText.replace(regex, (match) => {
                if (firstOccurrence) {
                    firstOccurrence = false;
                    return `${match}[^${footnoteMap[acronym]}]`;
                }
                return match;
            });
        }
    });
    
    // Add footnote definitions at the end
    if (Object.keys(footnoteMap).length > 0) {
        processedText += '\n\n';
        Object.entries(footnoteMap).forEach(([acronym, num]) => {
            processedText += `[^${num}]: ${footnotes[acronym]}\n`;
        });
    }
    
    return processedText;
}

function processTimestamps() {
    const startTimeInput = document.getElementById('startTime').value;
    const recordingUrl = document.getElementById('recordingUrl').value;
    const editor = document.getElementById('editor');
    const content = editor.value;
    
    // Validation
    if (!startTimeInput) {
        alert('Please set the Meeting Start Time first!');
        return;
    }
    
    if (!recordingUrl) {
        alert('Please enter the Recording URL first!');
        return;
    }
    
    const startTime = parseTime(startTimeInput);
    if (!startTime) {
        alert('Invalid start time format!');
        return;
    }
    
    const startSeconds = timeToSeconds(startTime);
    
    let processedContent = content;
    let convertedCount = 0;
    
    // Get base YouTube URL without parameters
    const baseUrl = recordingUrl.split('?')[0];
    
    // First, strip existing links to get back to just timestamps
    // This handles already-processed timestamps like [18:42:15](url)
    processedContent = processedContent.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\([^)]+\)/g, '[$1]');
    
    // Now process all timestamps - keep original time in brackets, link based on elapsed
    const timestampRegex = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;
    
    processedContent = processedContent.replace(timestampRegex, (match, timeStr) => {
        const timestamp = parseTime(timeStr);
        if (!timestamp) return match;
        
        const timestampSeconds = timeToSeconds(timestamp);
        let elapsedSeconds = timestampSeconds - startSeconds;
        
        // Handle timestamps that cross midnight
        if (elapsedSeconds < 0) {
            elapsedSeconds += 24 * 3600;
        }
        
        const youtubeUrl = `${baseUrl}?t=${elapsedSeconds}`;
        
        convertedCount++;
        // Keep original timestamp in brackets, link to YouTube with elapsed time
        return `[${timeStr}](${youtubeUrl})`;
    });
    
    // Update editor with processed content
    editor.value = processedContent;
    
    // Show success message
    const infoBox = document.createElement('div');
    infoBox.className = 'info-box success';
    infoBox.innerHTML = `✅ Successfully processed ${convertedCount} timestamps to YouTube links!<br>Click any timestamp to jump to that moment in the video.`;
    
    const editorContainer = document.querySelector('.editor-container');
    const existingInfo = editorContainer.previousElementSibling;
    if (existingInfo && existingInfo.classList.contains('info-box')) {
        existingInfo.remove();
    }
    editorContainer.insertAdjacentElement('beforebegin', infoBox);
    
    setTimeout(() => {
        infoBox.remove();
    }, 5000);
    
    updateStatus(`Processed ${convertedCount} timestamps`);
}

function downloadMarkdown() {
    const title = document.getElementById('meetingTitle').value || 'Meeting Minutes';
    const url = document.getElementById('recordingUrl').value;
    const startTime = document.getElementById('startTime').value;
    const content = document.getElementById('editor').value;
    
    // Add footnote references
    const contentWithFootnotes = addFootnoteReferences(content);
    
    let markdown = '---\n';
    markdown += `title: "${title}"\n`;
    if (startTime) {
        markdown += `recording_start_time: "${startTime}"\n`;
    }
    if (url) {
        markdown += `recording_url: "${url}"\n`;
    }
    markdown += '---\n\n';
    markdown += contentWithFootnotes;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    updateStatus('Markdown downloaded');
}

function downloadPython() {
    const pythonScript = `#!/usr/bin/env python3
"""
Meeting Minutes Timestamp Processor
Converts clock time timestamps to YouTube-linked elapsed times
"""

import re
from datetime import datetime, timedelta
from pathlib import Path
import sys

def parse_time(time_str):
    """Parse HH:MM:SS or HH:MM format to datetime"""
    try:
        return datetime.strptime(time_str, "%H:%M:%S")
    except ValueError:
        return datetime.strptime(time_str, "%H:%M")

def time_to_seconds(time_str):
    """Convert HH:MM:SS to total seconds"""
    parts = time_str.split(':')
    if len(parts) == 3:
        h, m, s = map(int, parts)
        return h * 3600 + m * 60 + s
    elif len(parts) == 2:
        m, s = map(int, parts)
        return m * 60 + s
    return 0

def extract_frontmatter(content):
    """Extract YAML frontmatter from markdown"""
    match = re.match(r'^---\\n(.*?)\\n---\\n', content, re.DOTALL)
    if match:
        frontmatter = {}
        for line in match.group(1).split('\\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip().strip('"')
        return frontmatter, content[match.end():]
    return {}, content

def process_markdown(input_file, output_file=None):
    """Process markdown file and convert timestamps to YouTube links"""
    
    # Read the file
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract frontmatter
    frontmatter, body = extract_frontmatter(content)
    
    # Get required metadata
    recording_start = frontmatter.get('recording_start_time')
    recording_url = frontmatter.get('recording_url')
    
    if not recording_start:
        print("Error: recording_start_time not found in frontmatter")
        sys.exit(1)
    
    if not recording_url:
        print("Error: recording_url not found in frontmatter")
        sys.exit(1)
    
    # Parse start time
    try:
        if 'T' in recording_start:
            start_dt = datetime.fromisoformat(recording_start)
        else:
            start_dt = parse_time(recording_start)
    except Exception as e:
        print(f"Error parsing recording_start_time: {e}")
        sys.exit(1)
    
    # Strip existing links
    body = re.sub(r'\\[(\\d{1,2}:\\d{2}(?::\\d{2})?)\\]\\([^)]+\\)', r'[\\1]', body)
    
    # Find and replace timestamps
    timestamp_pattern = r'\\[(\\d{1,2}:\\d{2}(?::\\d{2})?)\\]'
    
    def replace_timestamp(match):
        timestamp = match.group(1)
        ts_dt = parse_time(timestamp)
        
        if 'T' in recording_start:
            elapsed = ts_dt - start_dt.replace(year=1900, month=1, day=1)
            elapsed_seconds = int(elapsed.total_seconds())
        else:
            ts_seconds = time_to_seconds(timestamp)
            start_seconds = time_to_seconds(recording_start.split('T')[1] if 'T' in recording_start else recording_start)
            elapsed_seconds = ts_seconds - start_seconds
            
            if elapsed_seconds < 0:
                elapsed_seconds += 24 * 3600
        
        base_url = recording_url.split('?')[0]
        youtube_url = f"{base_url}?t={elapsed_seconds}"
        
        return f"[{timestamp}]({youtube_url})"
    
    processed_body = re.sub(timestamp_pattern, replace_timestamp, body)
    
    # Reconstruct the file
    output_content = "---\\n"
    for key, value in frontmatter.items():
        output_content += f'{key}: "{value}"\\n'
    output_content += "---\\n\\n"
    output_content += processed_body
    
    # Write output
    if output_file is None:
        output_file = input_file.replace('.md', '_processed.md')
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(output_content)
    
    print(f"✅ Processed file saved to: {output_file}")
    
    count = len(re.findall(timestamp_pattern, body))
    print(f"📝 Converted {count} timestamps to YouTube links")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python process_minutes.py <input_file.md> [output_file.md]")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    process_markdown(input_file, output_file)
`;
    
    const blob = new Blob([pythonScript], { type: 'text/x-python' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'process_minutes.py';
    link.click();
    updateStatus('Python script downloaded');
}

// Keyboard shortcuts handler
function handleKeyboardShortcuts(e) {
    // ⌘; or Ctrl+; to insert timestamp
    if ((e.metaKey || e.ctrlKey) && e.key === ';') {
        e.preventDefault();
        insertTimestamp();
    }
    
    // ⌘S or Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        downloadMarkdown();
    }
    
    // ⌘P or Ctrl+P to process timestamps
    if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        processTimestamps();
    }
    
    // Enter key with auto-timestamp enabled
    if (e.key === 'Enter' && autoTimestamp) {
        e.preventDefault();
        const editor = e.target;
        const start = editor.selectionStart;
        const text = editor.value;
        const timestamp = `[${getCurrentTime()}]`;
        
        editor.value = text.substring(0, start) + '\n' + timestamp + ' ' + text.substring(start);
        editor.selectionStart = editor.selectionEnd = start + timestamp.length + 2;
    }
}