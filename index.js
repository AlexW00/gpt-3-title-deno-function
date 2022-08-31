import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { withCors } from "https://deno.land/x/cors_protocol@1.0.0-beta.2/mod.ts";
import { OpenAI } from "https://deno.land/x/openai/mod.ts";

// ##################################################################### //
// ############################### Server ############################## //
// ##################################################################### //

const GPT_TOKEN = initEnvVariable("GPT_TOKEN"),
	PORT = ":8080",
	gpt3 = new OpenAI(GPT_TOKEN);

async function handleRequest(request) {
	const { pathname } = new URL(request.url);

	// ~~~ handle different request methods ~~ //

	switch (request.method) {
		case "POST":
			return await handleGetRequest(request, pathname);
		case "GET":
			return new Response("test back");
	}
}

serve(withCors(handleRequest), { addr: PORT });
//serve(handleRequest, { addr: PORT });
console.log(`Listening on port ${PORT}`);

// ====================================================== //
// ================= GET request routes ================= //
// ====================================================== //

// ~~~~~~~~~~~~~~~ routing ~~~~~~~~~~~~~~~ //

const handleGetRequest = async (request, pathname) => {
	switch (pathname) {
		case "/":
			return await handleGenerateGpt3Title(request);
		default:
			return new Response(JSON.stringify({ title: "hi" }));
	}
};

const handleGenerateGpt3Title = async (request) => {
	const json = await request.json();

	if (json.blockContents) {
		const gptTitle = await generateGpt3Title(json);

		return new Response(
			JSON.stringify({
				gptTitle,
			}),
			{
				status: 200,
			}
		);
	}

	return new Response("", {
		status: 400,
	});
};

const generateGpt3Title = async (json) => {
	let noteContents = "";

	json.blockContents.forEach((blockContent) => {
		console.log(blockContent);
		noteContents += blockContent.title + "\n";
		noteContents += blockContent.inputValue + "\n\n";
	});

	const prompt = `These are the contents of your last 3 daily notes:\n"""\n${noteContents}"""\nComplete the following:\nRecently you were thinking about ..., what do you think about...?`,
		response = await gpt3.createCompletion(prompt, "text-davinci-002", 0.7),
		title = response.choices[0].text;

	// remove newlines and trailing whitspace
	return title.replace(/\n/g, "").trim();
};

// Helper
function initEnvVariable(name) {
	if (!Deno.env.get(name)) {
		console.error(`Environment variable ${name} not set!!!`);
	}
	return Deno.env.get(name) || "";
}
