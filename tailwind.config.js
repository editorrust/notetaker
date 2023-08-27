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
         },
         colors: {
            darkestcolor: "#18181B",
            greyplus: {
               "white": "#FFFFFF", // equiv
               "darkwhite": "#F6F6F6", // also equiv
               "darkerwhite": "#EAEAEA", // are equiv
               "lightest": "#E0E0E0", // equiv
               "light": "#D9D9D9", // same
               "medium": "#C4C4C4", // good
               "dark": "#A3A3A3", // mid
               "darkest": "#828282", // good
               "lightblack": "#4F4F4F", // same
               "black": "#444444", // equiv
               "darkblack": "#272727", // are equiv
               "night": "#202020", // also equiv
               "tar": "#181818" // equiv
            }
         }
      }
   },
   plugins: [],
}