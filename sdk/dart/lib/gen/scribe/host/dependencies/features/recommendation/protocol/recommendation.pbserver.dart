// This is a generated file - do not edit.
//
// Generated from scribe/host/dependencies/features/recommendation/protocol/recommendation.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import 'recommendation.pb.dart' as $1;
import 'recommendation.pbjson.dart';

export 'recommendation.pb.dart';

abstract class RecommendationServiceBase extends $pb.GeneratedService {
  $async.Future<$1.VoidResult> upsertUser(
      $pb.ServerContext ctx, $1.UpsertUserRequest request);
  $async.Future<$1.VoidResult> upsertItem(
      $pb.ServerContext ctx, $1.UpsertItemRequest request);
  $async.Future<$1.VoidResult> deleteUser(
      $pb.ServerContext ctx, $1.DeleteUserRequest request);
  $async.Future<$1.VoidResult> deleteItem(
      $pb.ServerContext ctx, $1.DeleteItemRequest request);
  $async.Future<$1.VoidResult> insertFeedback(
      $pb.ServerContext ctx, $1.InsertFeedbackRequest request);
  $async.Future<$1.RecommendResult> recommend(
      $pb.ServerContext ctx, $1.RecommendRequest request);

  $pb.GeneratedMessage createRequest($core.String methodName) {
    switch (methodName) {
      case 'UpsertUser':
        return $1.UpsertUserRequest();
      case 'UpsertItem':
        return $1.UpsertItemRequest();
      case 'DeleteUser':
        return $1.DeleteUserRequest();
      case 'DeleteItem':
        return $1.DeleteItemRequest();
      case 'InsertFeedback':
        return $1.InsertFeedbackRequest();
      case 'Recommend':
        return $1.RecommendRequest();
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $async.Future<$pb.GeneratedMessage> handleCall($pb.ServerContext ctx,
      $core.String methodName, $pb.GeneratedMessage request) {
    switch (methodName) {
      case 'UpsertUser':
        return upsertUser(ctx, request as $1.UpsertUserRequest);
      case 'UpsertItem':
        return upsertItem(ctx, request as $1.UpsertItemRequest);
      case 'DeleteUser':
        return deleteUser(ctx, request as $1.DeleteUserRequest);
      case 'DeleteItem':
        return deleteItem(ctx, request as $1.DeleteItemRequest);
      case 'InsertFeedback':
        return insertFeedback(ctx, request as $1.InsertFeedbackRequest);
      case 'Recommend':
        return recommend(ctx, request as $1.RecommendRequest);
      default:
        throw $core.ArgumentError('Unknown method: $methodName');
    }
  }

  $core.Map<$core.String, $core.dynamic> get $json =>
      RecommendationServiceBase$json;
  $core.Map<$core.String, $core.Map<$core.String, $core.dynamic>>
      get $messageJson => RecommendationServiceBase$messageJson;
}
