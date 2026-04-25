 const errorHandler = (err, req, res, next) => {
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: "Validation Failed",
      details: err.errors.map(e => ({ path: e.path[0], message: e.message }))
    });
  }

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
};

export {errorHandler}