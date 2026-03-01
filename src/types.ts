export interface SectionIR {
	name: string;
	order: number;
	content: string;
}

export interface PromptIR {
	filePath: string;
	sections: SectionIR[];
}

export interface TypeConfig {
	required: string[];
}

export interface Config {
	types: Record<string, TypeConfig>;
}

export interface LintError {
	file: string;
	code: string;
	message: string;
	severity: "error";
}
