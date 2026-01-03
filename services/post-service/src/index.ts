import type { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * Post Service - Main entry point
 * 
 * Handles post creation, deletion, and retrieval
 * Endpoints:
 * - POST /posts - Create new post
 * - GET /posts/{postId} - Get post by ID
 * - DELETE /posts/{postId} - Delete post
 * - GET /users/{userId}/posts - Get user's posts
 */

export const handler: APIGatewayProxyHandler = async (event) => {
  console.info('Post Service invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: event.requestContext.requestId,
  });

  try {
    // TODO: Implement routing logic based on event.path and event.httpMethod
    // TODO: Add input validation with Zod (280 character limit)
    // TODO: Implement XSS sanitization
    // TODO: Implement DynamoDB operations
    // TODO: Publish PostCreated/PostDeleted events to EventBridge

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Post Service is running',
        service: 'post-service',
        version: '1.0.0',
      }),
    };
  } catch (error) {
    console.error('Error in Post Service handler', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

// For local development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.POST_SERVICE_PORT || 3002;
  console.info(`Post Service running locally on port ${port}`);
  console.info('Use AWS SAM or LocalStack to test Lambda functions locally');
}
