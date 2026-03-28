export type Message = {
  type: "prompt" | "response"
  text: string
}