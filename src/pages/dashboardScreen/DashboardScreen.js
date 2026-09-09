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
    const [user, setUser] = useState({name: "Bryan", role: "admin"})
  
    const [fontsLoaded] = useFonts({
        Manrope_400Regular,
        Manrope_700Bold,
    });

    if (!fontsLoaded) {
        return null;
    }

    return(
    <View style={{width:"100%", height:"100%"}}>
        <View style={[styles.header, user.role === "company" && {height:240}]}> 
            <Text style={styles.welcome}>Boas vindas ao Reaproveita Franca,</Text>
            <Text style={styles.welcome2}>Olá, {user.name} 👋</Text>
            <Text style={styles.welcome3}>{user.role.toUpperCase()}</Text>
            {user.role === "company" && (
                <TouchableOpacity style={styles.buttonHeader}>
                    <Text style={{color:colors.white, fontFamily:fonts.bold,}}>Novo Material</Text>
                </TouchableOpacity>
            )}
        </View> 
        {user.role === "user" && (
            <View style={{width:"100%", height:"100%"}}>
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
                        <Text style={styles.recSubTitle}>
                            Calçados Franca
                        </Text>
                        <View style={styles.viewFooterRec}>
                            <Text style={styles.weightRec}>120kg</Text>
                            <Text style={styles.howFar}>0.8km</Text>
                        </View>
                    </View>

                    <View style={styles.recView}>
                        <Image source={require("../../../assets/images/product-reserved2.png")} style={styles.image}/>
                        <Text style={styles.recTitle}>
                            Retalhos Nobuck Preto
                        </Text>
                        <Text style={styles.recSubTitle}>
                            Estilos Couros
                        </Text>
                        <View style={styles.viewFooterRec}>
                            <Text style={styles.weightRec}>45kg</Text>
                            <Text style={styles.howFar}>2.4km</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.textRec}>Reservas Recentes</Text>
                <View style={styles.viewReserve}>
                    <View style={{alignSelf:"center", width:15 , height:15, borderRadius:100, backgroundColor:colors.primary}}/>
                    <View style={styles.viewReserveTexts}>
                        <Text style={styles.textEmphasis}>120 kg de Solado Borracha</Text>
                        <Text style={styles.textReserve}>Curtume Francês S.A • Retirar até 12/08</Text>
                    </View>
                    <Text style={styles.statusReserve}> Aprovado </Text>
                </View>
                <View style={styles.viewReserve}>
                    <View style={{alignSelf:"center", width:15 , height:15, borderRadius:100, backgroundColor:colors.accent}}/>
                    <View style={styles.viewReserveTexts}>
                        <Text style={styles.textEmphasis}>Placa EVA Coloridas</Text>
                        <Text style={styles.textReserve}>Fábrica Estrela • Aguardando Aprovação</Text>
                    </View>
                    <Text style={[styles.statusReserve, {color: "#be6600", backgroundColor:"#ff880059"}]}> Análise </Text>
                </View>
            </View>
        )}
        {user.role === "company" && (
            <View style={{width:"100%", height:"100%"}}>
                <Text style={styles.balance}>Resumo do Impacto: </Text>
                <View style={styles.viewsSummary}>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>Publicados</Text>
                        <Text style={styles.viewSummaryResumeEmphasis}>24 Lotes</Text>
                        <Text style={styles.viewSummaryFooterResume}>+4 este mês</Text>
                    </View>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>Reservas</Text>
                        <Text style={styles.viewSummaryResumeEmphasis}>8 Ativos</Text>
                        <Text style={styles.viewSummaryFooterResume}>2 aguardando coleta</Text>          
                    </View>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>KG Desviados</Text>
                        <Text style={styles.viewSummaryResumeEmphasis}>1.450 KG</Text>
                        <Text style={styles.viewSummaryFooterResume}>equivalente a 4.3t CC</Text>       
                    </View>
                </View>
                <Text style={styles.textRec}>Atividades Recentes</Text>
                <View style={styles.viewReserve}>
                    <View style={{alignSelf:"center", width:15 , height:15, borderRadius:100, backgroundColor:colors.accent}}/>
                    <View style={styles.viewReserveTexts}>
                        <Text style={styles.textEmphasis}>Lote de EVA Reservado</Text>
                        <Text style={styles.textReserve}>Hoje às 14:30 • Solados Estrela</Text>
                    </View>
                    <Text style={[styles.statusReserve, {color: "#be6600", backgroundColor:"#ff880059"}]}> Aguardando {"\n"}Coleta </Text>
                </View>
                <View style={styles.viewReserve}>
                    <View style={{alignSelf:"center", width:15 , height:15, borderRadius:100, backgroundColor:colors.primary}}/>
                    <View style={styles.viewReserveTexts}>
                        <Text style={styles.textEmphasis}>Retalho de Couro Coletados</Text>
                        <Text style={styles.textReserve}>Ontem às 16:15 • Silvana M.</Text>
                    </View>
                        <Text style={styles.statusReserve}>Finalizado</Text>
                </View>
            </View>
        )} 
        {user.role === "admin" && (
            <View style={{width:"100%", height:"100%"}}>
                <Text style={styles.balance}>Registro de Usuários: </Text>
                <View style={styles.viewsSummary}>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>Usuários</Text>
                        <Text style={styles.viewSummaryReserveEmphasis}>170</Text>
                        <Text style={styles.viewSummaryFooterReserve}>+ 3 Desde SET</Text>
                    </View>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>Empresa</Text>
                        <Text style={styles.viewSummaryNegociationEmphasis}>15</Text>
                        <Text style={styles.viewSummaryFooterNegociation}>+1 Desde SET</Text>          
                    </View>
                    <View style={styles.viewSummary}>
                        <Text style={styles.viewSummaryTitle}>Admin</Text>
                        <Text style={styles.viewSummaryAcquiredEmphasis}>1</Text>
                        <Text style={styles.viewSummaryFooterAcquired}>+0 Desde SET</Text>       
                    </View>
                </View>
                <Text style={styles.textRec}>Gestão do Reaproveita Franca</Text>

                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Adicionar um novo ADMIN</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Gerenciar Usuários</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Gerenciar Anúncios</Text>
                </TouchableOpacity>
            </View>
        )}
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
    welcome3:{
        marginTop:-6,
        marginLeft:42,
        fontSize: 15,
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
        width: "32%",
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
        height:190,
        alignSelf:"center",
        flexDirection:"row",
        justifyContent:"space-between"
    },
    recView: {
        width:"48%",
        height:190,
        borderRadius:20,
        borderWidth:0.2,
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
    },
    recTitle:{ 
        marginTop: 8,
        marginLeft: 9,
        fontFamily: fonts.bold
    },
    recSubTitle: {
        marginLeft:9,
        fontFamily:fonts.regular,
        margintop:10,
        color: colors.textTertiary
    },
    viewFooterRec:{
        flexDirection:"row",
        justifyContent:"space-between",
        marginHorizontal:10,
        marginTop:10
    },
    weightRec:{
        fontFamily:fonts.bold,
        color:colors.accent
    },
    howFar:{
        color:colors.textTertiary,
        fontFamily:fonts.regular
    },
    viewReserve: {
        flexDirection:"row",
        padding:20,
        backgroundColor:colors.background,
        marginHorizontal:8,
        justifyContent:"space-between",
        borderRadius:20,
        borderWidth:0.2,
        borderColor:colors.textTertiary,
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        marginTop:10
    },
    textEmphasis:{
        fontFamily:fonts.bold,
        marginLeft:10,
        fontSize:15
    },
    textReserve:{
        fontFamily:fonts.regular,
        marginLeft:10,
        fontSize:12
    },
    statusReserve:{
        padding:4,
        backgroundColor: "#33ff0046",    
        alignSelf:"center",
        color:colors.textDark,
        fontFamily:fonts.bold,
        borderRadius:10
    },
    buttonHeader: {
        marginLeft:40,
        marginTop:20,
        padding: 14,
        borderRadius:10,
        backgroundColor:colors.primary,
        width:"31%",
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    viewSummaryResumeEmphasis: {
        marginTop:25,
        marginLeft:9,
        fontSize:22,
        fontFamily:fonts.bold
    },
    viewSummaryFooterResume:{
        marginTop: 8, 
        marginHorizontal:9,
        fontFamily:fonts.regular,
        color:colors.primary
    },
    button: {
        width: "90%",
        marginTop: 30,
        paddingHorizontal: 20,
        paddingVertical: 22,
        backgroundColor: colors.primary,
        borderRadius: 15,
        justifyContent:"center",
        alignSelf:"center",
        alignItems:"center"
    },
    buttonText: {
        color:"white",
        fontFamily:fonts.bold,
        fontSize:17  
    },
    
})