import { generateInterviewReport, getAllInterviewReport, getInterviewReport,generateResumePdf } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterveiwContext } from "../interview.context"
import { useParams } from "react-router"
export const useInterview = () => {
    const context = useContext(InterveiwContext)

    const { interviewId } = useParams()
    if (!context) {
        throw new Error("useInterview must be used within InterveiwProvider")
    }

    const { loading, setLoading, loadingMessage, setLoadingMessage, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, resume, selfDescription }) => {
        setLoading(true)
        setLoadingMessage("Generating your interview strategy...")
        try {
            const response = await generateInterviewReport({ jobDescription, resume, selfDescription })
            setReport(response.InterviewReport)
            return response.InterviewReport
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
            setLoadingMessage("")
        }
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        setLoadingMessage("Fetching interview report...")
        try {
            const response = await getInterviewReport(interviewId)
            setReport(response.interviewReport)
            return response.interviewReport
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
            setLoadingMessage("")
        }
    }

    const getReports = async () => {
        setLoading(true)
        setLoadingMessage("Loading recent reports...")
        try {
            const response = await getAllInterviewReport()
            setReports(response.interviewReports)
            return response.interviewReports
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
            setLoadingMessage("")
        }
    }


    const getResumePdf=async (interviewReportId)=>{
        setLoading(true)
        setLoadingMessage("Preparing your resume... it may take 30 sec")
        try {
            const response = await generateResumePdf(interviewReportId)
            const url=window.URL.createObjectURL(new Blob([response], { type: 'application/pdf' }))
            const link=document.createElement("a")
            link.href=url
            link.setAttribute("download",`resume_${interviewReportId}.pdf`)
            document.body.appendChild(link)
            link.click()
            return response
        } catch (error) {
            throw error
        } finally {
            setLoading(false)
            setLoadingMessage("")
        }
    }


    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])


    return {
        loading,
        loadingMessage,
        report,
        setReport,
        reports,
        setReports,
        generateReport,
        getReportById,
        getReports,
        getResumePdf
    }
}
