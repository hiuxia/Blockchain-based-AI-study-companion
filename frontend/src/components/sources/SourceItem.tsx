"use client";
import React from "react";
import { useSourceStore } from "../../lib/store/sourceStore";

interface SourceItemProps {
	id: string;
	name: string;
}

export const SourceItem: React.FC<SourceItemProps> = ({ id, name }) => {
	const { selectedSourceIds, toggleSelectSource } = useSourceStore();
	const isSelected = selectedSourceIds.includes(id);

	return (
		<div className="flex items-center py-2 px-3 hover:bg-blue-50 rounded-md">
			<div className="flex-shrink-0 mr-2">
				<svg
					className="w-5 h-5 text-red-500"
					fill="currentColor"
					viewBox="0 0 20 20"
				>
					<path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v10H5V5z" />
				</svg>
			</div>
			<div className="flex-1 truncate">{name}</div>
			<div className="flex-shrink-0 ml-2">
				<input
					type="checkbox"
					checked={isSelected}
					onChange={() => toggleSelectSource(id)}
					className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
				/>
			</div>
		</div>
	);
};
