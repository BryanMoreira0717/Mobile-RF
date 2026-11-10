import { Image, StyleSheet, Text, View } from "react-native";

import { getInitials, normalizePhoto } from "../../services/chat";
import colors from "../../theme/colors";
import { fonts } from "../../theme/fonts";

const PALETTE = [
  { background: "#ECFDF5", foreground: "#065F46" },
  { background: "#EFF6FF", foreground: "#1E3A8A" },
  { background: "#FEF3C7", foreground: "#92400E" },
  { background: "#FCE7F3", foreground: "#9D174D" },
  { background: "#EDE9FE", foreground: "#5B21B6" },
  { background: "#E0F2FE", foreground: "#075985" },
];

function paletteFor(seed) {
  const text = String(seed || "?");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash + text.charCodeAt(index) * (index + 1)) % 997;
  }

  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ name, photo, size = 48 }) {
  const uri = normalizePhoto(photo);
  const palette = paletteFor(name);
  const fontSize = Math.max(12, Math.round(size * 0.36));

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.image,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.background,
        },
      ]}
    >
      <Text
        style={[
          styles.initials,
          { color: palette.foreground, fontSize },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.borderLight,
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontFamily: fonts.bold,
    letterSpacing: 0.4,
  },
});
