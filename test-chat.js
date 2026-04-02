const base = 'http://localhost:3001';
(async () => {
  try {
    // Get first project or create one
    const projList = await fetch(base + '/api/projects');
    const projData = await projList.json();
    let projectId = projData.projects?.[0]?.id;
    
    if (!projectId) {
      const createRes = await fetch(base + '/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Chat', description: 'test' })
      });
      const created = await createRes.json();
      projectId = created.id;
    }
    
    console.log('Testing chat with projectId:', projectId);
    
    // Send chat message
    const chatRes = await fetch(base + '/api/projects/' + projectId + '/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello, how are you?' })
    });
    
    console.log('Chat response status:', chatRes.status);
    console.log('Content-Type:', chatRes.headers.get('Content-Type'));
    
    if (chatRes.status === 201) {
      const data = await chatRes.json();
      console.log('Success! Assistant response:');
      console.log(data.assistantMessage?.content?.slice(0, 300) || 'NO CONTENT');
    } else {
      const text = await chatRes.text();
      console.log('Error response:', text.slice(0, 200));
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  }
})();
