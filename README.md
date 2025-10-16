# Christian Corral - Portfolio Website

A modern, minimalist portfolio website showcasing the work of Christian Corral - Architect, Urban Planner, Dr.-Ing., Programmer, and Artist.

## 🎨 Design Philosophy

This website embodies architectural precision through:
- **Ultra-minimalist design** with frosted glass aesthetics
- **High contrast** and precise grid alignment
- **Dynamic GSAP animations** for smooth, professional interactions
- **Responsive design** optimized for all devices
- **Accessibility-first** approach with keyboard navigation support

## 🚀 Features

- **Frosted Glass Design**: Modern glassmorphism with backdrop blur effects
- **GSAP Animations**: Smooth entrance sequences and hover microinteractions
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Performance Optimized**: Fast loading with Vite build system
- **SEO Ready**: Semantic HTML and meta tags
- **Accessibility**: WCAG compliant with keyboard navigation

## 🛠️ Tech Stack

- **Vite** - Fast build tool and dev server
- **GSAP** - Professional-grade animations
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - No framework dependencies

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/Chrixco/Christian-Corral-Website.git
cd Christian-Corral-Website
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The site will be available at `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

This creates a `dist` folder with optimized static files ready for deployment.

## 🌐 GitHub Pages Deployment

This project is configured for GitHub Pages deployment. Follow these steps:

### Automatic Deployment (Recommended)

Use the included npm script:
```bash
npm run deploy
```

This command will:
1. Build the project
2. Add the dist folder to git
3. Commit the changes
4. Push to the gh-pages branch

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Add the dist folder to git:
```bash
git add dist -f
```

3. Commit the changes:
```bash
git commit -m "Deploy"
```

4. Push to gh-pages branch:
```bash
git subtree push --prefix dist origin gh-pages
```

### Enable GitHub Pages

1. Go to your repository settings
2. Navigate to "Pages" section
3. Select "Deploy from a branch"
4. Choose "gh-pages" branch
5. Select "/ (root)" folder
6. Save the settings

Your site will be available at: `https://chrixco.github.io/Christian-Corral-Website/`

## 🎯 Customization

### Colors
Edit the CSS custom properties in `style.css`:
```css
:root {
  --accent-blue: #0077FF;
  --accent-orange: #FF7A00;
  --text-primary: #2d3748;
  /* ... other variables */
}
```

### Content
Update the content in `index.html`:
- Personal information in the hero section
- Social media links in the navigation
- Button destinations

### Animations
Modify GSAP animations in `main.js`:
- Entrance sequence timing
- Hover effect parameters
- Scroll trigger settings

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## ♿ Accessibility Features

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- High contrast mode support
- Reduced motion preferences respected
- Screen reader friendly

## 🔧 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run deploy` - Deploy to GitHub Pages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Christian Corral**
- Architect · Urban Planner · Dr.-Ing. · Programmer · Artist
- Architecture Portfolio: [chrixco.github.io/proyectualstudio](https://chrixco.github.io/proyectualstudio/)
- LinkedIn: [linkedin.com/in/christian-corral-burau-0a2bba1b1](https://www.linkedin.com/in/christian-corral-burau-0a2bba1b1/)
- GitHub: [github.com/Chrixco](https://github.com/Chrixco)

## 🙏 Acknowledgments

- **GSAP** for powerful animation capabilities
- **Vite** for lightning-fast development experience
- **Inter Font** for beautiful typography
- **GitHub Pages** for seamless hosting

---

*"Designing equity in urban space — across the globe."*
