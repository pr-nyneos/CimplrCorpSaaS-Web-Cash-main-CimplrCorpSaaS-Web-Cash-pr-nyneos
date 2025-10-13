// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        body: 'var(--bg-body)',
        'body-hover': 'var(--bg-body-hover)',
        'body-active': 'var(--bg-body-active)',
        text: 'var(--text-color)',
        'secondary-text': 'var(--secondary-text-color)',
        'secondary-text-dark': 'var(--secondary-text-color-dark)',
        border: 'var(--border-color)',
        'border-secondary': 'var(--secondary-border-color)',
        primary: 'var(--primary-color)',
        'primary-lt': 'var(--primary-color-lt)',
        'primary-fade': 'var(--primary-color-fade)',
        'primary-md': 'var(--primary-color-md)',
        'primary-lg': 'var(--primary-color-lg)',
        'primary-xl': 'var(--primary-color-xl)',
        'primary-hover': 'var(--primary-hover)',
        'primary-bg-hover': 'var(--primary-bg-hover)',
        'primary-bg-active': 'var(--primary-bg-active)',
        'secondary-color': 'var(--secondary-color)',
        'secondary-color-lt': 'var(--secondary-color-lt)',
        'secondary-color-dark': 'var(--secondary-color-dark)',
        'header-color': 'var(--header-color)',
        'red-color': 'var(--red-color)',
        
        
      },
      fontFamily: {
        base: 'var(--font-family)',
      },
      fontStyle: {
        base: 'var(--font-style)',
      },
      
      fontSize: {
        h1: 'var(--h1-size)',
        h2: 'var(--h2-size)',
        h3: 'var(--h3-size)',
        h4: 'var(--h4-size)',
      },
      
      spacing: {
        padding: 'var(--padding)',
        margin: 'var(--margin)',
      },
      borderWidth: {
        DEFAULT: 'var(--border-width)',
      },
      borderRadius: {
        btn: 'var(--btn-radius)',
        'btn-radius' : 'var(--btn-radius)'
      },
    },
  },
  plugins: [],
};
