import type { APIGatewayProxyHandler } from 'aws-lambda';

/**
 * Social Service - Main entry point
 * 
 * Handles follow/unfollow relationships and like management
 * Endpoints:
 * - POST /users/{userId}/follow - Follow user
 * - DELETE /users/{userId}/follow - Unfollow user
 * - POST /posts/{postId}/likes - Like post
 * - DELETE /posts/{postId}/likes - Unlike post
 */

export const handler: APIGatewayProxyHandler = async (event) => {
  console.info('Social Service invoked', {
    httpMethod: event.httpMethod,
    path: event.path,
    requestId: event.requestContext.requestId,
  });

  try {
    // TODO: Implement routing logic
    // TODO: Prevent self-follow
    // TODO: Prevent duplicate follows/likes (UNIQUE constraint)
    // TODO: Implement DynamoDB operations with Single Table Design
    // TODO: Publish FollowCreated/FollowDeleted/LikeCreated/LikeDeleted events
    // TODO: Subscribe to PostDeleted events (cleanup likes)

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Social Service is running',
        service: 'social-service',
        version: '1.0.0',
      }),
    };
  } catch (error) {
    console.error('Error in Social Service handler', error);

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
  const port = process.env.SOCIAL_SERVICE_PORT || 3003;
  console.info(`Social Service running locally on port ${port}`);
  console.info('Use AWS SAM or LocalStack to test Lambda functions locally');
}
