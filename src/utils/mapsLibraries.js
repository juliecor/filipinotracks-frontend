// Single shared `libraries` array for useJsApiLoader.
// `@react-google-maps/api` does a referential-equality check — every map
// component on the same page must pass the *same* array instance, otherwise
// the loader throws and the screen goes blank.
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry']
