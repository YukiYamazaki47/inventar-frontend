import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarInset,
} from "@/components/ui/sidebar"


function App() {
  return (
    <SidebarProvider>
  <div className="flex h-screen w-full">
        {/* SIDEBAR */}
        <Sidebar>
          <SidebarHeader />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem><a>Item 1</a></SidebarMenuItem>
                  <SidebarMenuItem><a>Item 2</a></SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter />
        </Sidebar>

        <SidebarInset>
          <SidebarTrigger className="m-2" />
          <div className="p-4">
            Main content goes here
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}


export default App
