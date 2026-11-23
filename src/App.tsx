import { useRoute } from "./lib/route";
import { HomeView } from "./views/HomeView";
import { EditorView } from "./views/EditorView";
import { CalendarView } from "./views/CalendarView";

function App() {
  const route = useRoute();
  if (route.name === "edit") return <EditorView key={route.id} id={route.id} token={route.token} />;
  if (route.name === "view") return <CalendarView key={route.id} id={route.id} />;
  return <HomeView />;
}

export default App;
