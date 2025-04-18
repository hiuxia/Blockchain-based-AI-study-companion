import { MainLayout } from "../components/layout/MainLayout";
import { SourcesList } from "../components/sources/SourcesList";
import { ChatInterface } from "../components/chat/ChatInterface";
import { OutputPanel } from "../components/output/OutputPanel";
import { GenerateButton } from "../components/GenerateButton";

export default function Home() {
	return (
		<MainLayout>
			<div className="relative flex h-full w-full">
				{/* Sources Panel (left sidebar) */}
				<div className="w-64 lg:w-72 flex-shrink-0">
					<SourcesList />
				</div>

				{/* Generate Button (centered at top) */}
				<GenerateButton />

				{/* Chat Interface (middle section) */}
				<div className="flex-1 border-l border-r border-gray-200">
					<ChatInterface />
				</div>

				{/* Output Panel (right section) */}
				<div className="w-1/3 flex-shrink-0">
					<OutputPanel />
				</div>
			</div>
		</MainLayout>
	);
}
