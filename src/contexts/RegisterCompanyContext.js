import { createContext, useState } from "react";

export const CadastroEmpresaContext = createContext();

export function CadastroEmpresaProvider({ children }) {

    const dadosIniciais = {
        name: "",
        doc_hmac: "",
        email: "",
        password: "",
        cellphone: "",
        photo: null,

        cep: "",
        street: "",
        neighborhood: "",
        number: "",
        city: "",
        country: "",
    };

    const [dadosEmpresa, setDadosEmpresa] = useState(dadosIniciais);

    const atualizarDados = (novosDados) => {
        setDadosEmpresa((dadosAnteriores) => ({
            ...dadosAnteriores,
            ...novosDados
        }));
    };

    const limparCadastro = () => {
        setDadosEmpresa(dadosIniciais);
    };

    return (
        <CadastroEmpresaContext.Provider
            value={{
                dadosEmpresa,
                atualizarDados,
                limparCadastro
            }}
        >
            {children}
        </CadastroEmpresaContext.Provider>
    );
}