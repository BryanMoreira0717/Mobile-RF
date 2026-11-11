import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import sheets from "../services/axios";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
} from "react-native";
import { SvgUri } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import colors from "../theme/colors";
import { fonts } from "../theme/fonts";

function getErrorMessage(error) {
  if (error?.response?.status === 401) {
    return "Sua sessão expirou. Faça login novamente.";
  }
  if (error?.response?.status === 429) {
    return "Muitas tentativas. Aguarde um minuto e tente novamente.";
  }
  const message = error?.response?.data?.error;
  if (typeof message === "string" && message.length <= 500) return message;
  if (!error?.response && error?.isAxiosError) {
    return "Não foi possível acessar a API. Confira sua conexão e o endereço do servidor.";
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export default function MercadoPagoCard() {
  const [account, setAccount] = useState(null);
  const [checking, setChecking] = useState(true);
  const [opening, setOpening] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const requestVersion = useRef(0);
  const openingRef = useRef(false);

  const connected = account?.connected === true;
  const expired = connected && account?.credentials_expired === true;
  const loading = checking || opening || disconnecting;
  const disabled = loading;

  const statusLabel = checking
    ? "Consultando conexão..."
    : error
    ? "Não foi possível consultar"
    : expired
    ? "Conectado · credencial expirada"
    : connected
    ? "Conectado"
    : "Não conectado";

  const buttonLabel = disconnecting
    ? "Desconectando Mercado Pago..."
    : opening
    ? "Abrindo Mercado Pago..."
    : checking
    ? "Consultando..."
    : connected
    ? "Desconectar Mercado Pago"
    : error
    ? "Tentar novamente"
    : "Conectar Mercado Pago";

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      requestVersion.current += 1;
    };
  }, []);

  const refreshAccount = useCallback(async () => {
    const version = ++requestVersion.current;
    if (mounted.current) {
      setChecking(true);
      setError("");
    }

    try {
      const { data } = await sheets.getMercadoPagoAccount();
      if (typeof data?.connected !== "boolean" ||
          typeof data?.credentials_expired !== "boolean") {
        throw new Error("Resposta de conexão inválida.");
      }
      if (mounted.current && requestVersion.current === version) {
        setAccount(data);
      }
      return data;
    } catch (requestError) {
      if (mounted.current && requestVersion.current === version) {
        setAccount(null);
        setError(getErrorMessage(requestError));
      }
      throw requestError;
    } finally {
      if (mounted.current && requestVersion.current === version) {
        setChecking(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshAccount().catch(() => {});
      let previousState = AppState.currentState;

      const subscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active" && previousState !== "active" && !openingRef.current) {
          void refreshAccount().catch(() => {});
        }
        previousState = nextState;
      });

      return () => {
        subscription.remove();
        requestVersion.current += 1;
      };
    }, [refreshAccount])
  );

  async function handleConnection() {
    if (openingRef.current || loading) return;
    openingRef.current = true;
    setOpening(true);

    try {
      // O estado atual da API determina se devemos conectar ou desconectar.
      const current = await refreshAccount();
      if (!mounted.current) return;
      if (current.connected) {
        setOpening(false);
        setDisconnecting(true);
        const { data } = await sheets.disconnectMercadoPago();
        if (data?.connected !== false) {
          throw new Error("A API não confirmou a desconexão.");
        }
        if (mounted.current) {
          // Invalida consultas anteriores para não restaurar um vínculo antigo.
          requestVersion.current += 1;
          setAccount({ connected: false, credentials_expired: false, environment: data.environment });
          setChecking(false);
          setError("");
        }
        return;
      }

      const { data } = await sheets.connectMercadoPago();
      if (typeof data?.authorization_url !== "string") {
        throw new Error("A API não retornou o link de autorização.");
      }

      const url = new URL(data.authorization_url);
      if (url.origin !== "https://auth.mercadopago.com.br" ||
          url.pathname !== "/authorization" || url.username || url.password) {
        throw new Error("O link de autorização retornado é inválido.");
      }

      // O callback atual termina no backend. O titular volta manualmente.
      await Linking.openURL(url.toString());
    } catch (requestError) {
      if (mounted.current) {
        Alert.alert("Mercado Pago", getErrorMessage(requestError));
      }
    } finally {
      openingRef.current = false;
      if (mounted.current) {
        setOpening(false);
        setDisconnecting(false);
      }
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View
          accessible
          accessibilityLabel="Mercado Pago"
          style={styles.logo}
        >
          <SvgUri
            width={40}
            height={40}
            fill="#009EE3"
            uri="https://cdn.jsdelivr.net/npm/simple-icons@v15/icons/mercadopago.svg"
          />
        </View>

        <View style={styles.heading}>
          <Text style={styles.title}>Recebimentos</Text>

          <Text style={styles.status}>
            Mercado Pago · {statusLabel}
          </Text>
        </View>

        {connected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={22}
            color={colors.primaryDark}
          />
        )}
      </View>

      <Text style={styles.description}>
        {connected
          ? "Sua empresa está vinculada ao Mercado Pago. A conta precisa estar habilitada para receber vendas."
          : "Conecte a conta da sua empresa para receber pelas vendas no Reaproveita."}
      </Text>

      <Pressable
        onPress={handleConnection}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={
          buttonLabel
        }
        accessibilityState={{
          disabled,
          busy: loading,
        }}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
          connected && styles.buttonConnected,
          loading && styles.buttonLoading,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <>
            <Text style={styles.buttonText}>
              {buttonLabel}
            </Text>

            <MaterialCommunityIcons
              name={connected ? "link-off" : "open-in-new"}
              size={19}
              color={colors.white}
            />
          </>
        )}
      </Pressable>

      {error ? (
        <View>
          <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
          <Pressable
            onPress={() => { void refreshAccount().catch(() => {}); }}
            disabled={loading}
            accessibilityRole="button"
            style={styles.retry}
          >
            <Text style={styles.retryText}>Consultar conexão novamente</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.caption}>
        {connected
          ? "Desconectar impede novas cobranças pelo vínculo. O histórico de pagamentos é preservado."
          : "Autorize no Mercado Pago e volte ao app para conferir a conexão."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    padding: 16,
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.textPrimary,
  },
  status: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  button: {
    minHeight: 54,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#00649E",
  },
  buttonPressed: {
    backgroundColor: "#005287",
    transform: [{ scale: 0.98 }],
  },
  buttonConnected: {
    backgroundColor: colors.error,
  },
  buttonLoading: {
    opacity: 0.75,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    flexShrink: 1,
  },
  error: {
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
  },
  retry: {
    minHeight: 44,
    justifyContent: "center",
  },
  retryText: {
    color: colors.primaryDark,
    fontFamily: fonts.bold,
    fontSize: 12,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});

