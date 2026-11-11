import { View, Text, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import colors from "../theme/colors";
import { fonts } from "../theme/fonts";

// Marca igual à do site: setas de reciclagem + "reaproveita." + "FRANCA".
// serifada: versão do painel (letreiro serifado, sem o ícone).
// clara: para usar em cima do verde.
export default function Brand({ serifada = false, clara = false }) {
  const cor = clara ? colors.white : colors.primaryDark;

  if (serifada) {
    return (
      <View style={styles.serifBox} accessibilityLabel="Reaproveita Franca">
        <Text style={[styles.serifName, { color: cor }]}>
          reaproveita<Text style={styles.dot}>.</Text>
        </Text>
        <Text style={[styles.serifCity, { color: cor }]}>FRANCA</Text>
      </View>
    );
  }

  return (
    <View style={styles.brand} accessibilityLabel="Reaproveita Franca">
      <Svg width={34} height={34} viewBox="0 0 48 48" fill="none">
        <Path
          d="M22 5a19 19 0 0 1 17 10M43 22a19 19 0 0 1-10 17M26 43A19 19 0 0 1 9 33M5 26A19 19 0 0 1 15 9"
          stroke={cor}
          strokeWidth={5}
        />
        <Path
          d="m34 5 8 13-15-2 7-11ZM43 34l-13 8 2-15 11 7ZM14 43 6 30l15 2-7 11ZM5 14l13-8-2 15-11-7Z"
          fill={cor}
        />
      </Svg>

      <View>
        <Text style={[styles.name, { color: cor }]}>reaproveita.</Text>
        <Text style={[styles.city, { color: cor }]}>FRANCA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -1.2,
  },
  city: {
    marginTop: 3,
    paddingLeft: 2,
    fontFamily: fonts.regular,
    fontSize: 7,
    letterSpacing: 4.5,
  },
  serifBox: {
    alignItems: "center",
  },
  serifName: {
    fontFamily: fonts.serif,
    fontWeight: "bold",
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -1,
  },
  dot: {
    color: colors.accent,
  },
  serifCity: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 9,
    letterSpacing: 6,
  },
});
