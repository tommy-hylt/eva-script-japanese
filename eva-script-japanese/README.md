# Eva Script Japanese

A responsive web application to display Evangelion 3.33 (You Can Not Redo) dialog scripts in Japanese, Hiragana, and English.

## 🎬 Features

- **Multi-language Display**: Japanese (kanji/kana), Hiragana readings, and English translations
- **Pagination**: Navigate through 6 parts of the movie script
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Eva-themed UI**: Purple gradient theme matching the Evangelion aesthetic
- **Clean Typography**: Large Japanese text, small hiragana, normal English with timestamps

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 📊 Data Structure

Each script entry:
```json
{
  "time": "HH:MM:SS",
  "japanese": "Original Japanese text",
  "hiragana": "Full hiragana reading",
  "english": "English translation"
}
```

## 🎨 Design

- **Purple theme** inspired by Evangelion
- **Responsive** for mobile and desktop
- **Clean layout** with easy-to-read typography

**Development Server**: http://localhost:5173
