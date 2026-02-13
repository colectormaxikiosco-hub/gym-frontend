import { Box } from "@mui/material"
import Navbar from "./Navbar"

const MainLayout = ({ children }) => {
  return (
    <Box className="min-h-screen bg-gray-50">
      <Navbar />
      <Box className="min-h-[calc(100vh-64px)]">{children}</Box>
    </Box>
  )
}

export default MainLayout
