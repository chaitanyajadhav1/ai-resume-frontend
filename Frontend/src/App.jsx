
import { RouterProvider } from "react-router"
import { router } from "./app.router.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterveiwProvider } from "./features/interview/interview.context.jsx"
function App() {

  return (
    <AuthProvider>
      <InterveiwProvider>
  <RouterProvider router={router} />
      </InterveiwProvider>
    </AuthProvider>
  )
}

export default App
