async function handle() {
    return Response.json({ message: "Hello World!"});
}

export {
    handle as GET,
    handle as POST
}
