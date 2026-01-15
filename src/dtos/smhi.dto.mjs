const smhiDto = {
  weatherWarnings: (response) => {
    if (!response || !response.data) return null;
    const data = response.data;

    return {
      severity: data.inner.level || null,
      description: data.inner.en || null,
      type: data.inner.type || null,
      warningsCount: data.inner.warningsCount || 0,
      raw: data,
    };
  },
};

export default smhiDto;