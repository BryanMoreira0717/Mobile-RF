import {
  ImageBackground,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  Image,
  ScrollView 
} from "react-native";
import colors from "../../theme/colors";
import { useFonts } from 'expo-font';
import {
  Manrope_400Regular,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import { fonts } from "../../theme/fonts";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

export default function DashboardScreen({navigation}) {
    const [user, setUser] = useState({name: "Maria Joaquina", role: "user"})
  
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return(
    <View style={{width:"100%", height:"100%"}}>
        <View style={styles.header}> 
            <Text style={styles.welcome}>Boas vindas ao Reaproveita Franca,</Text>
            <Text style={styles.welcome2}>Olá, {user.name} 👋</Text>
        </View> 
        <Text style={styles.balance}>Seu Balanço do mês: </Text>
        <View style={styles.viewsSummary}>
            <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Reservados</Text>
                <Text style={styles.viewSummaryReserveEmphasis}>12</Text>
                <Text style={styles.viewSummaryFooterReserve}>+ 3 pendentes</Text>
            </View>
            <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Negociação</Text>
                <Text style={styles.viewSummaryNegociationEmphasis}>3</Text>
                <Text style={styles.viewSummaryFooterNegociation}>Chat Ativo</Text>          
            </View>
            <View style={styles.viewSummary}>
                <Text style={styles.viewSummaryTitle}>Adquiridos</Text>
                <Text style={styles.viewSummaryAcquiredEmphasis}>890 KG</Text>
                <Text style={styles.viewSummaryFooterAcquired}>Meta Batida 🎊</Text>       
            </View>
        </View>
        <View style={{justifyContent:"space-between", flexDirection: "row"}}>
            <Text style={styles.textRec}>Recomendados para Você</Text>
            <Text style={styles.textRec2}>Ver mais</Text>
        </View>

        <View style={styles.recViews}>
            <View style={styles.recView}>
                <Image source={require("../../../assets/images/product-reserved.png")} style={styles.image}/>
                <Text style={styles.recTitle}>
                    Sobra de Solados PU
                </Text>
            </View>

            <View style={styles.recView}>
                <Image source={require("../../../assets/images/product-reserved2.png")} style={styles.image}/>
                <Text style={styles.recTitle}>
                    Retalhos Nobuck Preto
                </Text>
            </View>
        </View>
    </View>
    )
    
}

const styles = StyleSheet.create({
    header: {
      width:"100%",
      height:170,
      backgroundColor: colors.primaryLight,
      borderBottomLeftRadius: 25,
      borderBottomRightRadius: 25,
    },
    welcome: {
        marginTop:80,
        marginLeft:40,
        fontSize: 14,
        fontFamily: fonts.regular
    },
    welcome2: {
        marginTop:3,
        marginLeft:40,
        fontSize: 25,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    balance: {
        marginTop:20,
        marginLeft:20,
        fontSize: 18,
        fontFamily: fonts.regular
    },
    viewsSummary: {
        marginTop: 15,
        width: "95%",
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    viewSummary: {
        backgroundColor: colors.background,
        width: "30%",
        height: 125,           // valor fixo em vez de "20%"
        borderRadius: 15,
        borderWidth: 1,
        borderColor: colors.textLight,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    viewSummaryTitle: {
        marginTop:5,
        marginLeft:7,
        color:colors.textTertiary
    },
    viewSummaryReserveEmphasis: {
        marginLeft:7,
        marginTop:16,
        fontSize:28,
        fontFamily:fonts.bold,
        color:colors.primary
    },
    viewSummaryNegociationEmphasis: {
        marginLeft:7,
        marginTop:16,
        fontSize:28,
        fontFamily:fonts.bold,
        color:colors.accent
    },
    viewSummaryAcquiredEmphasis: {
        marginLeft:7,
        marginTop:16,
        fontSize:28,
        fontFamily:fonts.bold,
        color:colors.primaryDark
    },
    viewSummaryFooterReserve: {
        marginLeft:7,
        marginTop:17,
        fontFamily: fonts.regular,
        color:colors.primary
    },
    viewSummaryFooterNegociation: {
        marginLeft:7,
        marginTop:17,
        fontFamily: fonts.regular,
        color:colors.accent        
    },
    viewSummaryFooterAcquired:{
        marginLeft:7,
        marginTop:17,
        fontFamily: fonts.regular,
        color:colors.primaryDark           
    },
    textRec: {
        marginTop:15,
        marginLeft:20,
        fontSize: 17,
        fontFamily: fonts.bold,
        color: colors.primaryDark
    },
    textRec2: {
        marginTop:20,
        marginLeft:20,
        marginRight:20,
        textDecorationLine:"underline",
        textDecorationColor:colors.primary,
        fontSize: 12,
        fontFamily: fonts.bold,
        color: colors.primary
    },
    recViews: {
        marginTop:17,
        width:"95%",
        height:180,
        alignSelf:"center",
        flexDirection:"row",
        justifyContent:"space-between"
    },
    recView: {
        width:"48%",
        height:180,
        borderRadius:20,
        borderWidth:1,
        borderColor:colors.textTertiary,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        backgroundColor:colors.background
    },
    image: {
        alignSelf:"center",
        marginTop:10,
        width:"95%",
        height:100,
        borderRadius:20
    }
})