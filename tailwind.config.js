/** @type {import('tailwindcss').Config} */
module.exports = {
   content: [
      './views/*.{html,ejs,js}',
      './views/partials/*.{html,ejs,js}',
      './scripts/*.{html,ejs,js}'
   ],
   theme: {
      extend: {
         fontFamily: {
            'nunito': ['Nunito', 'sans-serif']
         }
      }
   },
   plugins: [],
}