import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
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

export default function NavBar({
  estagio = "visitante",
  ativo,
  onNavigate,
}) {
  const itens = itensPorEstagio[estagio] ?? itensPorEstagio.visitante;

  return (
    <View style={styles.container}>
      {itens.map((item) => {
        const selecionado = ativo === item.id;
        const cor = selecionado
          ? colors.primary
          : colors.textTertiary;

        return (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{
              selected: selecionado,
              disabled: !onNavigate,
            }}
            disabled={!onNavigate}
            onPress={() => onNavigate?.(item.id)}
          >
            <View style={item.central ? styles.central : undefined}>
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={item.central ? colors.white : cor}
              />
            </View>

            {!item.central || estagio === "visitante" && (
              <Text
                style={[
                  styles.label,
                  {
                    color: cor,
                    fontFamily: selecionado
                      ? fonts.bold
                      : fonts.regular,
                  },
                ]}
              >
                {item.label}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
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
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    marginTop: 4,
    fontSize: 10,
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