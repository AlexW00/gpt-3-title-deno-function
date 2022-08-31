import { serve } from "https://deno.land/std@0.114.0/http/server.ts";
import { withCors } from "https://deno.land/x/cors_protocol@1.0.0-beta.2/mod.ts";

// ##################################################################### //
// ############################### Server ############################## //
// ##################################################################### //

const GPT_TOKEN = initEnvVariable("GPT_TOKEN"),
	PORT = ":8080";

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

	json.blockContents.forEach((blockContent, index) => {
		noteContents += "Day " + (index + 1) + ":\n\n";
		noteContents += blockContent.title + "\n";
		noteContents += blockContent.inputValue + "\n\n";
	});

	const prompt = `These are the contents of my last 3 daily notes:\n"""\n${noteContents}"""\n"""\nComplete the following sentence by replacing the areas marked with <>:\nRecently you wrote about <something i wrote down>, what do you think about <suggestion on how to improve this> to save energy?`,
		response = await createCompletion(prompt),
		title = response.choices[0].text;

	// remove newlines and trailing whitspace
	return title.replace(/\n/g, "").trim() + "?";
};

// Helper
function initEnvVariable(name) {
	if (!Deno.env.get(name)) {
		console.error(`Environment variable ${name} not set!!!`);
	}
	return Deno.env.get(name) || "";
}

// Fetch request

async function createCompletion(
	prompt = "",
	engine = "text-davinci-002",
	temperature = 1,
	maxTokens = 50,
	topP = 1,
	frequencyPenalty = 0,
	presencePenalty = 0,
	bestOf = 3,
	stop = [".", "!", "?"]
) {
	const response = await fetch(
		`https://api.openai.com/v1/engines/${engine}/completions`,
		{
			body: JSON.stringify({
				prompt: prompt,
				temperature: temperature,
				max_tokens: maxTokens,
				top_p: topP,
				frequency_penalty: frequencyPenalty,
				presence_penalty: presencePenalty,
				stop: stop,
				best_of: bestOf,
			}),
			headers: {
				Authorization: `Bearer ${GPT_TOKEN}`,
				"Content-Type": "application/json",
			},
			method: "POST",
		}
	);
	return response.json();
}
