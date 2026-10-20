import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  AccessibilityInfo,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../theme/colors";
import { fonts } from "../theme/fonts";

const itensPorEstagio = {
  empresa: [
    { id: "inicio", label: "Início", icon: "home-outline" },
    { id: "mapa", label: "Mapa", icon: "compass-outline" },
    {
      id: "publicar",
      label: "Publicar anúncio",
      icon: "plus",
      central: true,
    },
    {
      id: "anuncios",
      label: "Anúncios",
      icon: "package-variant-closed",
    },
    { id: "perfil", label: "Perfil", icon: "account-outline" },
  ],
  comprador: [
    { id: "inicio", label: "Início", icon: "home-outline" },
    { id: "mapa", label: "Mapa", icon: "compass-outline" },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: "cart-outline",
      central: true,
    },
    { id: "historico", label: "Histórico", icon: "history" },
    { id: "perfil", label: "Perfil", icon: "account-outline" },
  ],
  visitante: [
    {
      id: "inicio",
      label: "Início",
      icon: "account-outline",
      central: true,
    },
  ],
};

// Cada botão tem seus próprios valores animados.
// Os hooks ficam neste componente, fora do map da navbar.
function NavBarItem({ item, selecionado, visitante, focado, reduzirMovimento, onNavigate }) {
  const escalaToque = useRef(new Animated.Value(1)).current;
  const destaque = useRef(new Animated.Value(0)).current;
  const cor = selecionado ? colors.primary : colors.textTertiary;

  useEffect(() => {
    const valor = selecionado && focado ? 1 : 0;
    destaque.stopAnimation();

    if (reduzirMovimento === null) {
      destaque.setValue(0);
      return;
    }

    if (reduzirMovimento) {
      destaque.setValue(valor);
      return;
    }

    const animacao = Animated.spring(destaque, {
      toValue: valor,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
      overshootClamping: true,
      useNativeDriver: true,
    });
    animacao.start();
    return () => animacao.stop();
  }, [selecionado, focado, reduzirMovimento, destaque]);

  useEffect(() => {
    return () => escalaToque.stopAnimation();
  }, [escalaToque]);

  function animarToque(valor) {
    escalaToque.stopAnimation();
    if (reduzirMovimento !== false) {
      escalaToque.setValue(1);
      return;
    }
    Animated.spring(escalaToque, {
      toValue: valor,
      damping: 18,
      stiffness: 300,
      mass: 0.6,
      useNativeDriver: true,
    }).start();
  }

  const escalaAtiva = destaque.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const deslocamento = destaque.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={1}
      disabled={!onNavigate}
      onPressIn={() => animarToque(0.9)}
      onPressOut={() => animarToque(1)}
      onPress={() => onNavigate?.(item.id)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: selecionado, disabled: !onNavigate }}
    >
      <Animated.View style={[styles.itemContent, { transform: [{ scale: escalaToque }] }]}>
        <Animated.View
          style={{ transform: [{ translateY: deslocamento }, { scale: escalaAtiva }] }}
        >
          <View style={item.central ? styles.central : styles.iconContainer}>
            {!item.central && (
              <Animated.View
                pointerEvents="none"
                style={[styles.activeBackground, { opacity: destaque }]}
              />
            )}
            <MaterialCommunityIcons
              name={item.icon}
              size={24}
              color={item.central ? colors.white : cor}
            />
          </View>
        </Animated.View>

        {(!item.central || visitante) && (
          <Text
            style={[
              styles.label,
              { color: cor, fontFamily: selecionado ? fonts.bold : fonts.regular },
            ]}
          >
            {item.label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function NavBar({ estagio = "visitante", ativo, onNavigate }) {
  const itens = itensPorEstagio[estagio] ?? itensPorEstagio.visitante;
  const visitante = !itensPorEstagio[estagio] || estagio === "visitante";
  const focado = useIsFocused();
  const [reduzirMovimento, setReduzirMovimento] = useState(null);

  useEffect(() => {
    let montado = true;
    let preferenciaAlterada = false;

    const listener = AccessibilityInfo.addEventListener("reduceMotionChanged", (value) => {
      preferenciaAlterada = true;
      if (montado) setReduzirMovimento(value);
    });

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (montado && !preferenciaAlterada) setReduzirMovimento(value);
      })
      .catch(() => {});

    return () => {
      montado = false;
      listener.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      {itens.map((item) => (
        <NavBarItem
          key={item.id}
          item={item}
          selecionado={ativo === item.id}
          visitante={visitante}
          focado={focado}
          reduzirMovimento={reduzirMovimento}
          onNavigate={onNavigate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  itemContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 40,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primaryLight,
    borderRadius: 12,
  },
  label: {
    marginTop: 4,
    fontSize: 10,
    textAlign: "center",
  },
  central: {
    width: 40,
    height: 40,
    borderRadius: 100,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
});
