declare module 'facebook-nodejs-business-sdk' {
  const FacebookAdsApi: {
    init: (accessToken: string) => void;
  };
  export default FacebookAdsApi;
}
