// This is a generated file - do not edit.
//
// Generated from scribe/engine/dependencies/features/recommendation/protocol/recommendation.proto.

// @dart = 3.3

// ignore_for_file: annotate_overrides, camel_case_types, comment_references
// ignore_for_file: constant_identifier_names
// ignore_for_file: curly_braces_in_flow_control_structures
// ignore_for_file: deprecated_member_use_from_same_package, library_prefixes
// ignore_for_file: non_constant_identifier_names, prefer_relative_imports

import 'dart:async' as $async;
import 'dart:core' as $core;

import 'package:protobuf/protobuf.dart' as $pb;

import '../../../../../protocol/common.pb.dart' as $0;

export 'package:protobuf/protobuf.dart' show GeneratedMessageGenericExtensions;

class User extends $pb.GeneratedMessage {
  factory User({
    $core.String? id,
    $0.Json? labels,
    $core.String? comment,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (labels != null) result.labels = labels;
    if (comment != null) result.comment = comment;
    return result;
  }

  User._();

  factory User.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory User.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'User',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'labels',
        subBuilder: $0.Json.create)
    ..aOS(3, _omitFieldNames ? '' : 'comment')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  User clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  User copyWith(void Function(User) updates) =>
      super.copyWith((message) => updates(message as User)) as User;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static User create() => User._();
  @$core.override
  User createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static User getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<User>(create);
  static User? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get labels => $_getN(1);
  @$pb.TagNumber(2)
  set labels($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasLabels() => $_has(1);
  @$pb.TagNumber(2)
  void clearLabels() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureLabels() => $_ensure(1);

  @$pb.TagNumber(3)
  $core.String get comment => $_getSZ(2);
  @$pb.TagNumber(3)
  set comment($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasComment() => $_has(2);
  @$pb.TagNumber(3)
  void clearComment() => $_clearField(3);
}

class Item extends $pb.GeneratedMessage {
  factory Item({
    $core.String? id,
    $0.Json? labels,
    $core.String? comment,
    $core.Iterable<$core.String>? categories,
    $core.bool? isHidden,
    $core.String? timestamp,
  }) {
    final result = create();
    if (id != null) result.id = id;
    if (labels != null) result.labels = labels;
    if (comment != null) result.comment = comment;
    if (categories != null) result.categories.addAll(categories);
    if (isHidden != null) result.isHidden = isHidden;
    if (timestamp != null) result.timestamp = timestamp;
    return result;
  }

  Item._();

  factory Item.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Item.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Item',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'id')
    ..aOM<$0.Json>(2, _omitFieldNames ? '' : 'labels',
        subBuilder: $0.Json.create)
    ..aOS(3, _omitFieldNames ? '' : 'comment')
    ..pPS(4, _omitFieldNames ? '' : 'categories')
    ..aOB(5, _omitFieldNames ? '' : 'isHidden')
    ..aOS(6, _omitFieldNames ? '' : 'timestamp')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Item clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Item copyWith(void Function(Item) updates) =>
      super.copyWith((message) => updates(message as Item)) as Item;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Item create() => Item._();
  @$core.override
  Item createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Item getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Item>(create);
  static Item? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get id => $_getSZ(0);
  @$pb.TagNumber(1)
  set id($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasId() => $_has(0);
  @$pb.TagNumber(1)
  void clearId() => $_clearField(1);

  @$pb.TagNumber(2)
  $0.Json get labels => $_getN(1);
  @$pb.TagNumber(2)
  set labels($0.Json value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasLabels() => $_has(1);
  @$pb.TagNumber(2)
  void clearLabels() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Json ensureLabels() => $_ensure(1);

  @$pb.TagNumber(3)
  $core.String get comment => $_getSZ(2);
  @$pb.TagNumber(3)
  set comment($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasComment() => $_has(2);
  @$pb.TagNumber(3)
  void clearComment() => $_clearField(3);

  @$pb.TagNumber(4)
  $pb.PbList<$core.String> get categories => $_getList(3);

  @$pb.TagNumber(5)
  $core.bool get isHidden => $_getBF(4);
  @$pb.TagNumber(5)
  set isHidden($core.bool value) => $_setBool(4, value);
  @$pb.TagNumber(5)
  $core.bool hasIsHidden() => $_has(4);
  @$pb.TagNumber(5)
  void clearIsHidden() => $_clearField(5);

  @$pb.TagNumber(6)
  $core.String get timestamp => $_getSZ(5);
  @$pb.TagNumber(6)
  set timestamp($core.String value) => $_setString(5, value);
  @$pb.TagNumber(6)
  $core.bool hasTimestamp() => $_has(5);
  @$pb.TagNumber(6)
  void clearTimestamp() => $_clearField(6);
}

class Feedback extends $pb.GeneratedMessage {
  factory Feedback({
    $core.String? type,
    $core.String? userId,
    $core.String? itemId,
    $core.double? value,
    $core.String? timestamp,
  }) {
    final result = create();
    if (type != null) result.type = type;
    if (userId != null) result.userId = userId;
    if (itemId != null) result.itemId = itemId;
    if (value != null) result.value = value;
    if (timestamp != null) result.timestamp = timestamp;
    return result;
  }

  Feedback._();

  factory Feedback.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory Feedback.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'Feedback',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'type')
    ..aOS(2, _omitFieldNames ? '' : 'userId')
    ..aOS(3, _omitFieldNames ? '' : 'itemId')
    ..aD(4, _omitFieldNames ? '' : 'value')
    ..aOS(5, _omitFieldNames ? '' : 'timestamp')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Feedback clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  Feedback copyWith(void Function(Feedback) updates) =>
      super.copyWith((message) => updates(message as Feedback)) as Feedback;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static Feedback create() => Feedback._();
  @$core.override
  Feedback createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static Feedback getDefault() =>
      _defaultInstance ??= $pb.GeneratedMessage.$_defaultFor<Feedback>(create);
  static Feedback? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get type => $_getSZ(0);
  @$pb.TagNumber(1)
  set type($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasType() => $_has(0);
  @$pb.TagNumber(1)
  void clearType() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.String get userId => $_getSZ(1);
  @$pb.TagNumber(2)
  set userId($core.String value) => $_setString(1, value);
  @$pb.TagNumber(2)
  $core.bool hasUserId() => $_has(1);
  @$pb.TagNumber(2)
  void clearUserId() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get itemId => $_getSZ(2);
  @$pb.TagNumber(3)
  set itemId($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasItemId() => $_has(2);
  @$pb.TagNumber(3)
  void clearItemId() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.double get value => $_getN(3);
  @$pb.TagNumber(4)
  set value($core.double value) => $_setDouble(3, value);
  @$pb.TagNumber(4)
  $core.bool hasValue() => $_has(3);
  @$pb.TagNumber(4)
  void clearValue() => $_clearField(4);

  @$pb.TagNumber(5)
  $core.String get timestamp => $_getSZ(4);
  @$pb.TagNumber(5)
  set timestamp($core.String value) => $_setString(4, value);
  @$pb.TagNumber(5)
  $core.bool hasTimestamp() => $_has(4);
  @$pb.TagNumber(5)
  void clearTimestamp() => $_clearField(5);
}

class UpsertUserRequest extends $pb.GeneratedMessage {
  factory UpsertUserRequest({
    User? user,
  }) {
    final result = create();
    if (user != null) result.user = user;
    return result;
  }

  UpsertUserRequest._();

  factory UpsertUserRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UpsertUserRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UpsertUserRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOM<User>(1, _omitFieldNames ? '' : 'user', subBuilder: User.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpsertUserRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpsertUserRequest copyWith(void Function(UpsertUserRequest) updates) =>
      super.copyWith((message) => updates(message as UpsertUserRequest))
          as UpsertUserRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UpsertUserRequest create() => UpsertUserRequest._();
  @$core.override
  UpsertUserRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UpsertUserRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UpsertUserRequest>(create);
  static UpsertUserRequest? _defaultInstance;

  @$pb.TagNumber(1)
  User get user => $_getN(0);
  @$pb.TagNumber(1)
  set user(User value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasUser() => $_has(0);
  @$pb.TagNumber(1)
  void clearUser() => $_clearField(1);
  @$pb.TagNumber(1)
  User ensureUser() => $_ensure(0);
}

class UpsertItemRequest extends $pb.GeneratedMessage {
  factory UpsertItemRequest({
    Item? item,
  }) {
    final result = create();
    if (item != null) result.item = item;
    return result;
  }

  UpsertItemRequest._();

  factory UpsertItemRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory UpsertItemRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'UpsertItemRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOM<Item>(1, _omitFieldNames ? '' : 'item', subBuilder: Item.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpsertItemRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  UpsertItemRequest copyWith(void Function(UpsertItemRequest) updates) =>
      super.copyWith((message) => updates(message as UpsertItemRequest))
          as UpsertItemRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static UpsertItemRequest create() => UpsertItemRequest._();
  @$core.override
  UpsertItemRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static UpsertItemRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<UpsertItemRequest>(create);
  static UpsertItemRequest? _defaultInstance;

  @$pb.TagNumber(1)
  Item get item => $_getN(0);
  @$pb.TagNumber(1)
  set item(Item value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasItem() => $_has(0);
  @$pb.TagNumber(1)
  void clearItem() => $_clearField(1);
  @$pb.TagNumber(1)
  Item ensureItem() => $_ensure(0);
}

class DeleteUserRequest extends $pb.GeneratedMessage {
  factory DeleteUserRequest({
    $core.String? userId,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    return result;
  }

  DeleteUserRequest._();

  factory DeleteUserRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteUserRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteUserRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteUserRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteUserRequest copyWith(void Function(DeleteUserRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteUserRequest))
          as DeleteUserRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteUserRequest create() => DeleteUserRequest._();
  @$core.override
  DeleteUserRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteUserRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteUserRequest>(create);
  static DeleteUserRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);
}

class DeleteItemRequest extends $pb.GeneratedMessage {
  factory DeleteItemRequest({
    $core.String? itemId,
  }) {
    final result = create();
    if (itemId != null) result.itemId = itemId;
    return result;
  }

  DeleteItemRequest._();

  factory DeleteItemRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory DeleteItemRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'DeleteItemRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'itemId')
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteItemRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  DeleteItemRequest copyWith(void Function(DeleteItemRequest) updates) =>
      super.copyWith((message) => updates(message as DeleteItemRequest))
          as DeleteItemRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static DeleteItemRequest create() => DeleteItemRequest._();
  @$core.override
  DeleteItemRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static DeleteItemRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<DeleteItemRequest>(create);
  static DeleteItemRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get itemId => $_getSZ(0);
  @$pb.TagNumber(1)
  set itemId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasItemId() => $_has(0);
  @$pb.TagNumber(1)
  void clearItemId() => $_clearField(1);
}

class InsertFeedbackRequest extends $pb.GeneratedMessage {
  factory InsertFeedbackRequest({
    $core.Iterable<Feedback>? feedback,
  }) {
    final result = create();
    if (feedback != null) result.feedback.addAll(feedback);
    return result;
  }

  InsertFeedbackRequest._();

  factory InsertFeedbackRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory InsertFeedbackRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'InsertFeedbackRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..pPM<Feedback>(1, _omitFieldNames ? '' : 'feedback',
        subBuilder: Feedback.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  InsertFeedbackRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  InsertFeedbackRequest copyWith(
          void Function(InsertFeedbackRequest) updates) =>
      super.copyWith((message) => updates(message as InsertFeedbackRequest))
          as InsertFeedbackRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static InsertFeedbackRequest create() => InsertFeedbackRequest._();
  @$core.override
  InsertFeedbackRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static InsertFeedbackRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<InsertFeedbackRequest>(create);
  static InsertFeedbackRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<Feedback> get feedback => $_getList(0);
}

class RecommendRequest extends $pb.GeneratedMessage {
  factory RecommendRequest({
    $core.String? userId,
    $core.int? count,
    $core.String? category,
    $core.int? offset,
  }) {
    final result = create();
    if (userId != null) result.userId = userId;
    if (count != null) result.count = count;
    if (category != null) result.category = category;
    if (offset != null) result.offset = offset;
    return result;
  }

  RecommendRequest._();

  factory RecommendRequest.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RecommendRequest.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RecommendRequest',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOS(1, _omitFieldNames ? '' : 'userId')
    ..aI(2, _omitFieldNames ? '' : 'count', fieldType: $pb.PbFieldType.OU3)
    ..aOS(3, _omitFieldNames ? '' : 'category')
    ..aI(4, _omitFieldNames ? '' : 'offset', fieldType: $pb.PbFieldType.OU3)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RecommendRequest clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RecommendRequest copyWith(void Function(RecommendRequest) updates) =>
      super.copyWith((message) => updates(message as RecommendRequest))
          as RecommendRequest;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RecommendRequest create() => RecommendRequest._();
  @$core.override
  RecommendRequest createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RecommendRequest getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RecommendRequest>(create);
  static RecommendRequest? _defaultInstance;

  @$pb.TagNumber(1)
  $core.String get userId => $_getSZ(0);
  @$pb.TagNumber(1)
  set userId($core.String value) => $_setString(0, value);
  @$pb.TagNumber(1)
  $core.bool hasUserId() => $_has(0);
  @$pb.TagNumber(1)
  void clearUserId() => $_clearField(1);

  @$pb.TagNumber(2)
  $core.int get count => $_getIZ(1);
  @$pb.TagNumber(2)
  set count($core.int value) => $_setUnsignedInt32(1, value);
  @$pb.TagNumber(2)
  $core.bool hasCount() => $_has(1);
  @$pb.TagNumber(2)
  void clearCount() => $_clearField(2);

  @$pb.TagNumber(3)
  $core.String get category => $_getSZ(2);
  @$pb.TagNumber(3)
  set category($core.String value) => $_setString(2, value);
  @$pb.TagNumber(3)
  $core.bool hasCategory() => $_has(2);
  @$pb.TagNumber(3)
  void clearCategory() => $_clearField(3);

  @$pb.TagNumber(4)
  $core.int get offset => $_getIZ(3);
  @$pb.TagNumber(4)
  set offset($core.int value) => $_setUnsignedInt32(3, value);
  @$pb.TagNumber(4)
  $core.bool hasOffset() => $_has(3);
  @$pb.TagNumber(4)
  void clearOffset() => $_clearField(4);
}

class RecommendResult extends $pb.GeneratedMessage {
  factory RecommendResult({
    $core.Iterable<$core.String>? itemIds,
    $0.Failure? error,
  }) {
    final result = create();
    if (itemIds != null) result.itemIds.addAll(itemIds);
    if (error != null) result.error = error;
    return result;
  }

  RecommendResult._();

  factory RecommendResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory RecommendResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'RecommendResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..pPS(1, _omitFieldNames ? '' : 'itemIds')
    ..aOM<$0.Failure>(2, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RecommendResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  RecommendResult copyWith(void Function(RecommendResult) updates) =>
      super.copyWith((message) => updates(message as RecommendResult))
          as RecommendResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static RecommendResult create() => RecommendResult._();
  @$core.override
  RecommendResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static RecommendResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<RecommendResult>(create);
  static RecommendResult? _defaultInstance;

  @$pb.TagNumber(1)
  $pb.PbList<$core.String> get itemIds => $_getList(0);

  @$pb.TagNumber(2)
  $0.Failure get error => $_getN(1);
  @$pb.TagNumber(2)
  set error($0.Failure value) => $_setField(2, value);
  @$pb.TagNumber(2)
  $core.bool hasError() => $_has(1);
  @$pb.TagNumber(2)
  void clearError() => $_clearField(2);
  @$pb.TagNumber(2)
  $0.Failure ensureError() => $_ensure(1);
}

class VoidResult extends $pb.GeneratedMessage {
  factory VoidResult({
    $0.Failure? error,
  }) {
    final result = create();
    if (error != null) result.error = error;
    return result;
  }

  VoidResult._();

  factory VoidResult.fromBuffer($core.List<$core.int> data,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromBuffer(data, registry);
  factory VoidResult.fromJson($core.String json,
          [$pb.ExtensionRegistry registry = $pb.ExtensionRegistry.EMPTY]) =>
      create()..mergeFromJson(json, registry);

  static final $pb.BuilderInfo _i = $pb.BuilderInfo(
      _omitMessageNames ? '' : 'VoidResult',
      package: const $pb.PackageName(
          _omitMessageNames ? '' : 'scribe.clients.recommendation.v1'),
      createEmptyInstance: create)
    ..aOM<$0.Failure>(1, _omitFieldNames ? '' : 'error',
        subBuilder: $0.Failure.create)
    ..hasRequiredFields = false;

  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VoidResult clone() => deepCopy();
  @$core.Deprecated('See https://github.com/google/protobuf.dart/issues/998.')
  VoidResult copyWith(void Function(VoidResult) updates) =>
      super.copyWith((message) => updates(message as VoidResult)) as VoidResult;

  @$core.override
  $pb.BuilderInfo get info_ => _i;

  @$core.pragma('dart2js:noInline')
  static VoidResult create() => VoidResult._();
  @$core.override
  VoidResult createEmptyInstance() => create();
  @$core.pragma('dart2js:noInline')
  static VoidResult getDefault() => _defaultInstance ??=
      $pb.GeneratedMessage.$_defaultFor<VoidResult>(create);
  static VoidResult? _defaultInstance;

  @$pb.TagNumber(1)
  $0.Failure get error => $_getN(0);
  @$pb.TagNumber(1)
  set error($0.Failure value) => $_setField(1, value);
  @$pb.TagNumber(1)
  $core.bool hasError() => $_has(0);
  @$pb.TagNumber(1)
  void clearError() => $_clearField(1);
  @$pb.TagNumber(1)
  $0.Failure ensureError() => $_ensure(0);
}

class RecommendationApi {
  final $pb.RpcClient _client;

  RecommendationApi(this._client);

  $async.Future<VoidResult> upsertUser(
          $pb.ClientContext? ctx, UpsertUserRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'Recommendation', 'UpsertUser', request, VoidResult());
  $async.Future<VoidResult> upsertItem(
          $pb.ClientContext? ctx, UpsertItemRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'Recommendation', 'UpsertItem', request, VoidResult());
  $async.Future<VoidResult> deleteUser(
          $pb.ClientContext? ctx, DeleteUserRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'Recommendation', 'DeleteUser', request, VoidResult());
  $async.Future<VoidResult> deleteItem(
          $pb.ClientContext? ctx, DeleteItemRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'Recommendation', 'DeleteItem', request, VoidResult());
  $async.Future<VoidResult> insertFeedback(
          $pb.ClientContext? ctx, InsertFeedbackRequest request) =>
      _client.invoke<VoidResult>(
          ctx, 'Recommendation', 'InsertFeedback', request, VoidResult());
  $async.Future<RecommendResult> recommend(
          $pb.ClientContext? ctx, RecommendRequest request) =>
      _client.invoke<RecommendResult>(
          ctx, 'Recommendation', 'Recommend', request, RecommendResult());
}

const $core.bool _omitFieldNames =
    $core.bool.fromEnvironment('protobuf.omit_field_names');
const $core.bool _omitMessageNames =
    $core.bool.fromEnvironment('protobuf.omit_message_names');
