package com.weisong.backend.controller.Comment;


import com.weisong.backend.Token.UserLoginToken;
import com.weisong.backend.entities.Comment.Comment;
import com.weisong.backend.service.Comment.CommentService;
import com.weisong.backend.util.Result.BlogJSONResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.text.SimpleDateFormat;
import java.util.Date;


@RestController
@RequestMapping(value = "/comment")
public class CommentController {

    @Autowired
    CommentService commentService;

    @GetMapping(value = "/{articleUuid}")
    public BlogJSONResult getCommentByArticleUuid(@PathVariable("articleUuid")String articleUuid){
        return BlogJSONResult.ok(commentService.getCommentByArticleUuid(articleUuid));
    }

    @UserLoginToken
    @PostMapping(value = "/addComment")
    public BlogJSONResult writeComment(@RequestBody Comment comment){
        SimpleDateFormat a=new SimpleDateFormat("yyyy-MM-dd HH:mm");
        comment.setCommentTime(a.format(new Date()));
        commentService.writeComment(comment);
        return BlogJSONResult.ok();
    }
}
