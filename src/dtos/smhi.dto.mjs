const smhiDto = {
  weatherWarnings: (response) => {
    if (!response || !response.data) return null;
    const data = response.data;

    return {
      severity: data.inner.level || null,
      description: data.description || null,
      raw: data,
    };
  },
};

export default smhiDto;