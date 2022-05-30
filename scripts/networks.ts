function getNetworkType(name: string): "fantom" | undefined {
  if (name == "fantom") return "fantom";
}
const networkConf = {
  fantom: {
    admin: "0xE5227F141575DcE74721f4A9bE2D7D636F923044",
    ve: "0x8B42c6Cb07c8dD5fE5dB3aC03693867AFd11353d",
    deus: "0xDE5ed76E7c05eC5e4572CfC88d1ACEA165109E44",
  },
};
export { getNetworkType, networkConf };
