import { Children, createContext,useState } from "react";

export const InterveiwContext=createContext()

export const InterveiwProvider=({children})=>{
    const [loading ,setLoading]=useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");
    const [report,setReport]=useState(null);
    const [reports,setReports]=useState([]);

   return (
       <InterveiwContext.Provider value={{
            loading,
            setLoading,
            loadingMessage,
            setLoadingMessage,
            report,
            setReport,
            setReports,
            reports
        }}>
            {children}
        </InterveiwContext.Provider>
       )
}